"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";
import { Input, Select } from "@/components/ui/field";
import {
  STATUSES,
  PRIORITIES,
  CATEGORIES,
  statusLabel,
  priorityLabel,
  categoryLabel,
} from "@/lib/labels";

export function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Input
        placeholder="Search title, requester…"
        defaultValue={params.get("q") ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          if (debounce.current) clearTimeout(debounce.current);
          debounce.current = setTimeout(() => setParam("q", value), 300);
        }}
      />
      <Select defaultValue={params.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)} aria-label="Filter by status">
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{statusLabel[s]}</option>
        ))}
      </Select>
      <Select defaultValue={params.get("priority") ?? ""} onChange={(e) => setParam("priority", e.target.value)} aria-label="Filter by priority">
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>{priorityLabel[p]}</option>
        ))}
      </Select>
      <Select defaultValue={params.get("category") ?? ""} onChange={(e) => setParam("category", e.target.value)} aria-label="Filter by category">
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{categoryLabel[c]}</option>
        ))}
      </Select>
    </div>
  );
}
