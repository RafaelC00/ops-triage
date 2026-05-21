import { PrismaClient, type Category, type Priority, type Status } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type Seed = {
  title: string;
  description: string;
  requester: string;
  category: Category;
  priority: Priority;
  status: Status;
  owner: "admin" | "member" | null;
  notes?: string[];
};

const SAMPLE: Seed[] = [
  {
    title: "VPN dropping every 10 minutes for warehouse laptops",
    description:
      "Three laptops in the Dallas warehouse lose the VPN tunnel repeatedly. Scanners go offline during picking.",
    requester: "Maria Gonzalez",
    category: "IT",
    priority: "URGENT",
    status: "IN_PROGRESS",
    owner: "admin",
    notes: ["Confirmed it's only the Dell units on the 5GHz AP.", "Opened ticket with the firewall vendor."],
  },
  {
    title: "New hire needs email + Slack before Monday",
    description: "Account for Priya Nair (Merchandising). Start date Monday 9am.",
    requester: "Devon Clark",
    category: "HR",
    priority: "HIGH",
    status: "OPEN",
    owner: null,
  },
  {
    title: "Conference room A projector won't power on",
    description: "No light, no fan. Tried two outlets. Board review is Thursday.",
    requester: "Aisha Bello",
    category: "FACILITIES",
    priority: "MEDIUM",
    status: "OPEN",
    owner: "member",
  },
  {
    title: "Duplicate vendor invoice flagged in AP",
    description: "Invoice #88421 from Riverside Textiles appears twice. Need confirmation before payment run.",
    requester: "Tom Becker",
    category: "FINANCE",
    priority: "HIGH",
    status: "BLOCKED",
    owner: "admin",
    notes: ["Waiting on the vendor to confirm the original PO."],
  },
  {
    title: "Pallet jack #4 hydraulics leaking",
    description: "Slow leak, won't hold a full pallet. Safety risk on the dock.",
    requester: "Luis Romero",
    category: "LOGISTICS",
    priority: "HIGH",
    status: "OPEN",
    owner: null,
  },
  {
    title: "Request: standing desk for ergonomic accommodation",
    description: "Doctor's note on file with HR. Employee in the Austin office.",
    requester: "Hannah Kim",
    category: "FACILITIES",
    priority: "LOW",
    status: "RESOLVED",
    owner: "member",
    notes: ["Desk ordered, ETA 1 week.", "Delivered and installed."],
  },
  {
    title: "Shared drive permissions wrong for Finance folder",
    description: "Two interns can see payroll exports. Needs locking down today.",
    requester: "Tom Becker",
    category: "IT",
    priority: "URGENT",
    status: "OPEN",
    owner: null,
  },
  {
    title: "Coffee machine in break room out of service",
    description: "Error E8. Whole floor affected.",
    requester: "Greg Patel",
    category: "FACILITIES",
    priority: "LOW",
    status: "OPEN",
    owner: null,
  },
  {
    title: "Carrier rate sheet update for Q3",
    description: "Need the new FedEx zones loaded into the OMS before the next batch.",
    requester: "Nina Alvarez",
    category: "LOGISTICS",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    owner: "admin",
  },
  {
    title: "Laptop replacement for cracked screen",
    description: "Screen cracked after a drop. Marketing, needs it for a client demo Friday.",
    requester: "Chris O'Donnell",
    category: "IT",
    priority: "MEDIUM",
    status: "RESOLVED",
    owner: "member",
    notes: ["Loaner issued same day.", "Replacement unit imaged and handed over."],
  },
  {
    title: "Update PTO policy doc on the intranet",
    description: "Reflect the new carry-over rule effective next month.",
    requester: "Devon Clark",
    category: "HR",
    priority: "LOW",
    status: "CLOSED",
    owner: "member",
  },
  {
    title: "Expense reimbursement stuck in approval",
    description: "Submitted 3 weeks ago, still pending. Employee following up.",
    requester: "Sofia Marin",
    category: "FINANCE",
    priority: "MEDIUM",
    status: "OPEN",
    owner: null,
  },
];

async function main() {
  const adminPassword = await bcrypt.hash("Reviewer123!", 10);
  const memberPassword = await bcrypt.hash("Member123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "reviewer@cgk.test" },
    update: { password: adminPassword, role: "ADMIN", name: "CGK Reviewer" },
    create: { email: "reviewer@cgk.test", name: "CGK Reviewer", password: adminPassword, role: "ADMIN" },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@cgk.test" },
    update: { password: memberPassword, role: "USER", name: "Sam Operator" },
    create: { email: "member@cgk.test", name: "Sam Operator", password: memberPassword, role: "USER" },
  });

  // Idempotent reseed of request data.
  await prisma.event.deleteMany();
  await prisma.note.deleteMany();
  await prisma.request.deleteMany();

  let offsetMinutes = 60 * 24 * 6; // start ~6 days ago and walk forward
  for (const s of SAMPLE) {
    const ownerId = s.owner === "admin" ? admin.id : s.owner === "member" ? member.id : null;
    const createdById = Math.random() > 0.5 ? admin.id : member.id;
    const createdAt = new Date(Date.now() - offsetMinutes * 60_000);
    offsetMinutes -= Math.floor(Math.random() * 600 + 120);

    const request = await prisma.request.create({
      data: {
        title: s.title,
        description: s.description,
        requester: s.requester,
        category: s.category,
        priority: s.priority,
        status: s.status,
        createdById,
        ownerId,
        createdAt,
        events: {
          create: [
            {
              type: "created",
              message: `Request created by ${createdById === admin.id ? admin.name : member.name}`,
              actorId: createdById,
              createdAt,
            },
          ],
        },
      },
    });

    if (s.status !== "OPEN") {
      await prisma.event.create({
        data: {
          requestId: request.id,
          type: "status_changed",
          message: `Status set to ${s.status}`,
          actorId: ownerId ?? createdById,
          createdAt: new Date(createdAt.getTime() + 30 * 60_000),
        },
      });
    }

    for (const [i, body] of (s.notes ?? []).entries()) {
      const at = new Date(createdAt.getTime() + (i + 1) * 45 * 60_000);
      await prisma.note.create({
        data: { requestId: request.id, body, authorId: ownerId ?? createdById, createdAt: at },
      });
      await prisma.event.create({
        data: {
          requestId: request.id,
          type: "note_added",
          message: "Note added",
          actorId: ownerId ?? createdById,
          createdAt: at,
        },
      });
    }
  }

  const count = await prisma.request.count();
  console.log(`Seeded ${count} requests + 2 users (reviewer@cgk.test / member@cgk.test).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
