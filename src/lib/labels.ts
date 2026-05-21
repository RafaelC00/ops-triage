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

// Tailwind badge styles
export const priorityStyles: Record<Priority, string> = {
  LOW: "bg-slate-100 text-slate-600 ring-slate-200",
  MEDIUM: "bg-sky-50 text-sky-700 ring-sky-200",
  HIGH: "bg-amber-50 text-amber-700 ring-amber-200",
  URGENT: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const statusStyles: Record<Status, string> = {
  OPEN: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-blue-200",
  BLOCKED: "bg-rose-50 text-rose-700 ring-rose-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CLOSED: "bg-slate-100 text-slate-500 ring-slate-200",
};

// Sort weights so the queue can lead with what matters.
export const priorityWeight: Record<Priority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};
