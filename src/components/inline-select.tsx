"use client";

import { useTransition } from "react";
import { Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function InlineSelect({
  value,
  options,
  action,
  label,
  className,
}: {
  value: string;
  options: { value: string; label: string }[];
  action: (value: string) => Promise<void>;
  label: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      aria-label={label}
      defaultValue={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(() => action(next));
      }}
      className={cn(pending && "opacity-60", className)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}
