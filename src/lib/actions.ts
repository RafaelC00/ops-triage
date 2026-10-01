"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth, signIn } from "@/auth";
import { PRIORITIES, STATUSES, CATEGORIES } from "@/lib/labels";
import type { Priority, Status, Category } from "@prisma/client";

// ── Auth guards (server-side, enforced on every mutation) ───────────────────
async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session.user;
}

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}

// ── Auth flows ──────────────────────────────────────────────────────────────
export async function authenticate(_prev: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) return "Invalid email or password.";
    throw error; // re-throw the redirect
  }
}

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function registerUser(_prev: string | undefined, formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input.";

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return "An account with that email already exists.";

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, password: hash, role: "USER" } });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) return "Account created — please sign in.";
    throw error;
  }
}

// ── Request mutations ────────────────────────────────────────────────────────
const createSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(140),
  description: z.string().trim().max(2000).optional().default(""),
  requester: z.string().trim().min(1, "Requester is required").max(80),
  category: z.enum(CATEGORIES as [Category, ...Category[]]),
  priority: z.enum(PRIORITIES as [Priority, ...Priority[]]),
});

export type CreateState = { error?: string };

export async function createRequest(_prev: CreateState, formData: FormData): Promise<CreateState> {
  const user = await requireUser();
  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    requester: formData.get("requester"),
    category: formData.get("category"),
    priority: formData.get("priority"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const created = await prisma.request.create({
    data: {
      ...parsed.data,
      createdById: user.id,
      events: {
        create: { type: "created", message: `Request created by ${user.name ?? user.email}`, actorId: user.id },
      },
    },
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/requests/${created.id}`);
}

export async function updateStatus(id: string, status: Status) {
  const user = await requireUser();
  const current = await prisma.request.findUnique({ where: { id } });
  if (!current || current.status === status) return;

  await prisma.request.update({
    where: { id },
    data: {
      status,
      events: { create: { type: "status_changed", message: `Status changed to ${status}`, actorId: user.id } },
    },
  });
  revalidatePath(`/dashboard/requests/${id}`);
  revalidatePath("/dashboard");
}

export async function updatePriority(id: string, priority: Priority) {
  const user = await requireUser();
  const current = await prisma.request.findUnique({ where: { id } });
  if (!current || current.priority === priority) return;

  await prisma.request.update({
    where: { id },
    data: {
      priority,
      events: { create: { type: "priority_changed", message: `Priority changed to ${priority}`, actorId: user.id } },
    },
  });
  revalidatePath(`/dashboard/requests/${id}`);
  revalidatePath("/dashboard");
}

export async function assignOwner(id: string, ownerId: string | null) {
  const user = await requireUser();
  const owner = ownerId ? await prisma.user.findUnique({ where: { id: ownerId } }) : null;
  await prisma.request.update({
    where: { id },
    data: {
      ownerId,
      events: {
        create: {
          type: "owner_changed",
          message: owner ? `Assigned to ${owner.name ?? owner.email}` : "Unassigned",
          actorId: user.id,
        },
      },
    },
  });
  revalidatePath(`/dashboard/requests/${id}`);
  revalidatePath("/dashboard");
}

export async function addNote(id: string, body: string) {
  const user = await requireUser();
  const trimmed = body.trim();
  if (!trimmed) return;

  await prisma.note.create({ data: { requestId: id, body: trimmed, authorId: user.id } });
  await prisma.event.create({
    data: { requestId: id, type: "note_added", message: "Note added", actorId: user.id },
  });
  revalidatePath(`/dashboard/requests/${id}`);
}

// Admin-only destructive action (RBAC demonstration).
export async function deleteRequest(id: string) {
  await requireAdmin();
  await prisma.request.delete({ where: { id } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
