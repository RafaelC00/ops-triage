"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  LayoutDashboard,
  AlertTriangle,
  CircleDot,
  Loader2,
  Monitor,
  Users,
  DollarSign,
  Building2,
  Truck,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Command {
  id: string;
  label: string;
  group: string;
  icon: React.ReactNode;
  action: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHighlighted(0);
  }, []);

  const run = useCallback(
    (cmd: Command) => {
      cmd.action();
      close();
    },
    [close],
  );

  // Build command list inside the component so router is captured correctly.
  const commands: Command[] = [
    {
      id: "new-request",
      label: "New request",
      group: "Actions",
      icon: <Plus size={15} />,
      action: () => router.push("/dashboard/new"),
    },
    {
      id: "go-to-queue",
      label: "Go to queue",
      group: "Navigate",
      icon: <LayoutDashboard size={15} />,
      action: () => router.push("/dashboard"),
    },
    {
      id: "show-urgent",
      label: "Show urgent",
      group: "Filter",
      icon: <AlertTriangle size={15} />,
      action: () => router.push("/dashboard?priority=URGENT"),
    },
    {
      id: "show-open",
      label: "Show open",
      group: "Filter",
      icon: <CircleDot size={15} />,
      action: () => router.push("/dashboard?status=OPEN"),
    },
    {
      id: "show-in-progress",
      label: "Show in progress",
      group: "Filter",
      icon: <Loader2 size={15} />,
      action: () => router.push("/dashboard?status=IN_PROGRESS"),
    },
    {
      id: "filter-it",
      label: "Filter: IT",
      group: "Category",
      icon: <Monitor size={15} />,
      action: () => router.push("/dashboard?category=IT"),
    },
    {
      id: "filter-hr",
      label: "Filter: HR",
      group: "Category",
      icon: <Users size={15} />,
      action: () => router.push("/dashboard?category=HR"),
    },
    {
      id: "filter-finance",
      label: "Filter: Finance",
      group: "Category",
      icon: <DollarSign size={15} />,
      action: () => router.push("/dashboard?category=Finance"),
    },
    {
      id: "filter-facilities",
      label: "Filter: Facilities",
      group: "Category",
      icon: <Building2 size={15} />,
      action: () => router.push("/dashboard?category=Facilities"),
    },
    {
      id: "filter-logistics",
      label: "Filter: Logistics",
      group: "Category",
      icon: <Truck size={15} />,
      action: () => router.push("/dashboard?category=Logistics"),
    },
    {
      id: "clear-filters",
      label: "Clear filters",
      group: "Actions",
      icon: <X size={15} />,
      action: () => router.push("/dashboard"),
    },
  ];

  // Filtered list
  const filtered =
    query.trim() === ""
      ? commands
      : commands.filter((c) =>
          c.label.toLowerCase().includes(query.toLowerCase()),
        );

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  // Global keydown: open on Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Autofocus when opening
  useEffect(() => {
    if (open) {
      // Defer so the element is rendered before we focus
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Keyboard navigation inside the palette
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((prev) => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted(
          (prev) => (prev - 1 + filtered.length) % filtered.length,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[highlighted];
        if (cmd) run(cmd);
      }
    },
    [close, filtered, highlighted, run],
  );

  // Scroll highlighted item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[highlighted] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  if (!open) return null;

  // Group commands for display
  const groups = Array.from(new Set(filtered.map((c) => c.group)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] bg-black/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        // Close when clicking the backdrop (not the panel itself)
        if (e.target === e.currentTarget) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-[560px] mx-4 rounded-2xl border border-white/10 bg-[#0c0e13] shadow-[0_0_60px_rgba(0,0,0,0.7),0_0_24px_rgba(34,211,238,0.08)] overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            className="text-slate-500 shrink-0"
            aria-hidden="true"
          >
            <path
              d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.966 3.326a4.5 4.5 0 1 1 .707-.707l2.57 2.57a.5.5 0 0 1-.707.707l-2.57-2.57Z"
              fill="currentColor"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-slate-200 placeholder:text-slate-500 font-mono text-sm outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Results list */}
        <div className="max-h-[340px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center font-mono text-sm text-slate-500">
              No commands match &ldquo;{query}&rdquo;
            </p>
          ) : (
            <ul ref={listRef} role="listbox" aria-label="Commands">
              {groups.map((group) => (
                <li key={group} role="presentation">
                  {/* Group header */}
                  <p className="px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                    {group}
                  </p>
                  {/* Commands in this group */}
                  {filtered
                    .filter((c) => c.group === group)
                    .map((cmd) => {
                      const globalIdx = filtered.indexOf(cmd);
                      const isHighlighted = globalIdx === highlighted;
                      return (
                        <div
                          key={cmd.id}
                          role="option"
                          aria-selected={isHighlighted}
                          onMouseEnter={() => setHighlighted(globalIdx)}
                          onClick={() => run(cmd)}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                            isHighlighted
                              ? "bg-white/[0.06] text-[#22d3ee]"
                              : "text-slate-300 hover:bg-white/[0.04]"
                          }`}
                        >
                          <span
                            className={`shrink-0 ${isHighlighted ? "text-[#22d3ee]" : "text-slate-500"}`}
                          >
                            {cmd.icon}
                          </span>
                          <span className="font-mono text-sm flex-1">
                            {cmd.label}
                          </span>
                          {isHighlighted && (
                            <span className="font-mono text-[10px] text-slate-500">
                              ↵
                            </span>
                          )}
                        </div>
                      );
                    })}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer keycap hints */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/10">
          <span className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
            <kbd className="rounded border border-white/15 bg-white/5 px-1.5 font-mono text-[10px] text-slate-400">
              ↑
            </kbd>
            <kbd className="rounded border border-white/15 bg-white/5 px-1.5 font-mono text-[10px] text-slate-400">
              ↓
            </kbd>
            navigate
          </span>
          <span className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
            <kbd className="rounded border border-white/15 bg-white/5 px-1.5 font-mono text-[10px] text-slate-400">
              ↵
            </kbd>
            select
          </span>
          <span className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
            <kbd className="rounded border border-white/15 bg-white/5 px-1.5 font-mono text-[10px] text-slate-400">
              esc
            </kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
