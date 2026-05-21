"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Wifi, Clock3, Command } from "lucide-react";

export function StatusBar({
  ip,
  loginAt,
  urgent,
}: {
  ip: string;
  loginAt?: number;
  urgent: number;
}) {
  const [now, setNow] = useState("");
  const [egg, setEgg] = useState(false);

  useEffect(() => {
    const tick = () =>
      setNow(new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: "UTC" }) + " UTC");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    console.log("%c◆ OPS TRIAGE — command deck online", "color:#22d3ee;font-weight:bold;font-size:12px");
    console.log("%cInternal operations console · all systems operational", "color:#818cf8");
  }, []);

  const lastLogin = loginAt
    ? new Date(loginAt).toLocaleString("en-GB", { hour12: false })
    : "—";
  const critical = urgent > 0;

  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface)] font-mono text-[11px] text-[var(--text-muted)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-6 py-1.5">
        <span className="flex items-center gap-1.5">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${critical ? "bg-amber-400" : "bg-emerald-400"} animate-pulse`}
          />
          {critical ? "STATUS: DEGRADED" : "STATUS: NOMINAL"}
        </span>

        {critical && (
          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3 w-3" /> {urgent} URGENT UNRESOLVED
          </span>
        )}

        <span className="ml-auto hidden items-center gap-1 sm:flex">
          <Wifi className="h-3 w-3" /> {ip}
        </span>
        <span className="hidden items-center gap-1 md:flex">
          <Clock3 className="h-3 w-3" /> last login {lastLogin}
        </span>
        <span className="flex items-center gap-1 text-[var(--text-3)]">
          <Activity className="h-3 w-3 text-cyan-400" /> {now}
        </span>
        <span className="hidden items-center gap-0.5 text-[var(--text-faint)] lg:flex">
          <Command className="h-3 w-3" />K
        </span>
        <button
          onClick={() => setEgg((v) => !v)}
          className="text-[var(--text-faint)] transition-colors hover:text-cyan-400"
          aria-label="System diagnostics"
          title="◆"
        >
          ◆
        </button>
      </div>

      {egg && (
        <div className="mx-auto max-w-6xl px-6 pb-1.5 text-[11px] text-cyan-300/80">
          ↳ Ops Triage · internal operations console · keeping the queue clear, one request at a time.
        </div>
      )}
    </div>
  );
}
