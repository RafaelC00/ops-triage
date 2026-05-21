import Link from "next/link";
import { Inbox, Loader2, AlertTriangle, UserX, ArrowRight } from "lucide-react";
import { getRequests, getQueueStats } from "@/lib/data";
import { HealthSummary } from "@/components/health-summary";
import { Filters } from "@/components/filters";
import { PriorityBadge, StatusBadge, CategoryBadge } from "@/components/badges";
import { formatDate } from "@/lib/utils";
import type { Status, Priority, Category } from "@prisma/client";

type SearchParams = Promise<{ q?: string; status?: string; priority?: string; category?: string }>;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters = {
    q: sp.q,
    status: sp.status as Status | undefined,
    priority: sp.priority as Priority | undefined,
    category: sp.category as Category | undefined,
  };

  const [requests, stats] = await Promise.all([getRequests(filters), getQueueStats()]);

  const statCards = [
    { label: "Open", value: stats.open, icon: Inbox, tint: "text-cyan-400 bg-cyan-500/10" },
    { label: "In progress", value: stats.inProgress, icon: Loader2, tint: "text-blue-300 bg-blue-500/10" },
    { label: "Urgent (open)", value: stats.urgent, icon: AlertTriangle, tint: "text-rose-400 bg-rose-500/10" },
    { label: "Unassigned", value: stats.unassigned, icon: UserX, tint: "text-amber-300 bg-amber-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Request queue</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Triage incoming operations requests by priority.</p>
      </div>

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

      <Filters />

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--panel)] p-12 text-center">
          <Inbox className="mx-auto h-8 w-8 text-[var(--text-2)]" />
          <p className="mt-3 text-sm text-[var(--text-muted)]">No requests match these filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-sm md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium">Request</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {requests.map((r) => (
                  <tr key={r.id} className="group hover:bg-[var(--surface)]">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/requests/${r.id}`} className="font-medium text-[var(--text)] hover:text-cyan-400">
                        {r.title}
                      </Link>
                      <div className="text-xs text-[var(--text-3)]">{r.requester}</div>
                    </td>
                    <td className="px-4 py-3"><CategoryBadge value={r.category} /></td>
                    <td className="px-4 py-3"><PriorityBadge value={r.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge value={r.status} /></td>
                    <td className="px-4 py-3 text-[var(--text-3)]">{r.owner?.name ?? <span className="text-[var(--text-3)]">—</span>}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/requests/${r.id}`} className="text-[var(--text-2)] group-hover:text-cyan-400">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {requests.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/requests/${r.id}`}
                className="block rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium text-[var(--text)]">{r.title}</span>
                  <PriorityBadge value={r.priority} />
                </div>
                <div className="mt-1 text-xs text-[var(--text-3)]">{r.requester} · {formatDate(r.createdAt)}</div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge value={r.status} />
                  <CategoryBadge value={r.category} />
                  {r.owner?.name && <span className="text-xs text-[var(--text-muted)]">· {r.owner.name}</span>}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
