import { Badge } from "@/components/ui/badge";
import {
  priorityLabel,
  priorityStyles,
  statusLabel,
  statusStyles,
  categoryLabel,
} from "@/lib/labels";
import type { Priority, Status, Category } from "@prisma/client";

export function PriorityBadge({ value }: { value: Priority }) {
  return <Badge className={priorityStyles[value]}>{priorityLabel[value]}</Badge>;
}

export function StatusBadge({ value }: { value: Status }) {
  return <Badge className={statusStyles[value]}>{statusLabel[value]}</Badge>;
}

export function CategoryBadge({ value }: { value: Category }) {
  return <Badge className="bg-slate-50 text-slate-600 ring-slate-200">{categoryLabel[value]}</Badge>;
}
