import Link from "next/link";
import { Inbox, Loader2, AlertTriangle, UserX, ArrowRight } from "lucide-react";
import { getRequests, getQueueStats } from "@/lib/data";
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
    { label: "Open", value: stats.open, icon: Inbox, tint: "text-indigo-600 bg-indigo-50" },
    { label: "In progress", value: stats.inProgress, icon: Loader2, tint: "text-blue-600 bg-blue-50" },
    { label: "Urgent (open)", value: stats.urgent, icon: AlertTriangle, tint: "text-rose-600 bg-rose-50" },
    { label: "Unassigned", value: stats.unassigned, icon: UserX, tint: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Request queue</h1>
        <p className="mt-1 text-sm text-slate-500">Triage incoming operations requests by priority.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className={`grid h-7 w-7 place-items-center rounded-lg ${s.tint}`}>
                <s.icon className="h-4 w-4" />
              </span>
              <span className="text-sm text-slate-500">{s.label}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <Filters />

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Inbox className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No requests match these filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Request</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r.id} className="group hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/requests/${r.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                        {r.title}
                      </Link>
                      <div className="text-xs text-slate-400">{r.requester}</div>
                    </td>
                    <td className="px-4 py-3"><CategoryBadge value={r.category} /></td>
                    <td className="px-4 py-3"><PriorityBadge value={r.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge value={r.status} /></td>
                    <td className="px-4 py-3 text-slate-600">{r.owner?.name ?? <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/requests/${r.id}`} className="text-slate-300 group-hover:text-indigo-600">
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
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium text-slate-900">{r.title}</span>
                  <PriorityBadge value={r.priority} />
                </div>
                <div className="mt-1 text-xs text-slate-400">{r.requester} · {formatDate(r.createdAt)}</div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge value={r.status} />
                  <CategoryBadge value={r.category} />
                  {r.owner?.name && <span className="text-xs text-slate-500">· {r.owner.name}</span>}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
