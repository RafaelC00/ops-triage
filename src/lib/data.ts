import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma, Status, Priority, Category } from "@prisma/client";

export type RequestFilters = {
  q?: string;
  status?: Status;
  priority?: Priority;
  category?: Category;
};

/**
 * Queue ordered by priority (URGENT first — enum declared LOW→URGENT, so `desc`
 * surfaces the most important) then most recent. This is the "what do I handle
 * next" ordering the brief asks for.
 */
export async function getRequests(filters: RequestFilters) {
  const where: Prisma.RequestWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.category) where.category = filters.category;
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { requester: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  return prisma.request.findMany({
    where,
    include: { owner: { select: { id: true, name: true, email: true } } },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
}

export async function getRequest(id: string) {
  return prisma.request.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      notes: {
        include: { author: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      events: {
        include: { actor: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getQueueStats() {
  const [open, inProgress, urgent, unassigned] = await Promise.all([
    prisma.request.count({ where: { status: "OPEN" } }),
    prisma.request.count({ where: { status: "IN_PROGRESS" } }),
    prisma.request.count({ where: { priority: "URGENT", status: { notIn: ["RESOLVED", "CLOSED"] } } }),
    prisma.request.count({ where: { ownerId: null, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
  ]);
  return { open, inProgress, urgent, unassigned };
}

export async function listMembers() {
  return prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } });
}
