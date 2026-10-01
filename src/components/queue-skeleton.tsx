export function HeroStatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-[132px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--panel)]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[88px] animate-pulse rounded-xl border border-[var(--border)] bg-[var(--panel)]" />
        ))}
      </div>
    </div>
  );
}

export function RequestListSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-[var(--border)] px-4 py-3.5 last:border-0">
          <div className="h-4 flex-1 animate-pulse rounded bg-[var(--surface)]" />
          <div className="h-4 w-14 animate-pulse rounded bg-[var(--surface)]" />
          <div className="h-4 w-14 animate-pulse rounded bg-[var(--surface)]" />
          <div className="h-4 w-20 animate-pulse rounded bg-[var(--surface)]" />
        </div>
      ))}
    </div>
  );
}
