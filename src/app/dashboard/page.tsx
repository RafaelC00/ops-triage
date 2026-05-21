import { Suspense } from "react";
import { Filters } from "@/components/filters";
import { HeroStats } from "@/components/hero-stats";
import { RequestList } from "@/components/request-list";
import { HeroStatsSkeleton, RequestListSkeleton } from "@/components/queue-skeleton";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Request queue</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Triage incoming operations requests by priority.</p>
      </div>

      {/* Global stats + health — streamed independently of filters */}
      <Suspense fallback={<HeroStatsSkeleton />}>
        <HeroStats />
      </Suspense>

      {/* Filters stay mounted (keeps input focus) while the list re-streams below */}
      <Filters />

      <Suspense key={JSON.stringify(filters)} fallback={<RequestListSkeleton />}>
        <RequestList filters={filters} />
      </Suspense>
    </div>
  );
}
