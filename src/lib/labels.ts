import type { Priority, Status, Category } from "@prisma/client";

export const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
export const STATUSES: Status[] = ["OPEN", "IN_PROGRESS", "BLOCKED", "RESOLVED", "CLOSED"];
export const CATEGORIES: Category[] = ["IT", "FACILITIES", "HR", "FINANCE", "LOGISTICS", "OTHER"];

export const priorityLabel: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const statusLabel: Record<Status, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const categoryLabel: Record<Category, string> = {
  IT: "IT",
  FACILITIES: "Facilities",
  HR: "HR",
  FINANCE: "Finance",
  LOGISTICS: "Logistics",
  OTHER: "Other",
};

// Tailwind badge styles (dark command-deck theme)
export const priorityStyles: Record<Priority, string> = {
  LOW: "bg-white/5 text-slate-400 ring-white/10",
  MEDIUM: "bg-sky-500/10 text-sky-300 ring-sky-500/20",
  HIGH: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
  URGENT: "bg-rose-500/10 text-rose-300 ring-rose-500/20",
};

export const statusStyles: Record<Status, string> = {
  OPEN: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/20",
  IN_PROGRESS: "bg-violet-500/10 text-violet-300 ring-violet-500/20",
  BLOCKED: "bg-rose-500/10 text-rose-300 ring-rose-500/20",
  RESOLVED: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
  CLOSED: "bg-white/5 text-slate-500 ring-white/10",
};

// Sort weights so the queue can lead with what matters.
export const priorityWeight: Record<Priority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};
