import { Inbox, Loader2, AlertTriangle, UserX } from "lucide-react";
import { getQueueStats } from "@/lib/data";
import { HealthSummary } from "@/components/health-summary";

export async function HeroStats() {
  const stats = await getQueueStats();

  const statCards = [
    { label: "Open", value: stats.open, icon: Inbox, tint: "text-cyan-400 bg-cyan-500/10" },
    { label: "In progress", value: stats.inProgress, icon: Loader2, tint: "text-blue-500 dark:text-blue-300 bg-blue-500/10" },
    { label: "Urgent (open)", value: stats.urgent, icon: AlertTriangle, tint: "text-rose-500 dark:text-rose-400 bg-rose-500/10" },
    { label: "Unassigned", value: stats.unassigned, icon: UserX, tint: "text-amber-600 dark:text-amber-300 bg-amber-500/10" },
  ];

  return (
    <>
      <HealthSummary open={stats.open} inProgress={stats.inProgress} urgent={stats.urgent} unassigned={stats.unassigned} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className={`grid h-7 w-7 place-items-center rounded-lg ${s.tint}`}>
                <s.icon className="h-4 w-4" />
              </span>
              <span className="text-sm text-[var(--text-muted)]">{s.label}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--text)]">{s.value}</p>
          </div>
        ))}
      </div>
    </>
  );
}
