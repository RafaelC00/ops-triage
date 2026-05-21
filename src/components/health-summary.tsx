import { AlertTriangle, Activity, CheckCircle2 } from "lucide-react";

type Stats = { open: number; inProgress: number; urgent: number; unassigned: number };

const LEVELS = {
  heavy: {
    word: "HEAVY DAY",
    blurb: "All hands — clear the urgent items first.",
    text: "text-rose-700 dark:text-rose-300",
    bar: "text-rose-500 dark:text-rose-400",
    glow: "shadow-[0_0_40px_rgba(244,63,94,0.12)]",
    Icon: AlertTriangle,
  },
  busy: {
    word: "BUSY",
    blurb: "Steady flow. Keep the queue moving.",
    text: "text-amber-700 dark:text-amber-300",
    bar: "text-amber-500 dark:text-amber-400",
    glow: "shadow-[0_0_40px_rgba(251,191,36,0.10)]",
    Icon: Activity,
  },
  chill: {
    word: "CHILL & NORMAL",
    blurb: "Queue's calm. Nice and tidy.",
    text: "text-emerald-700 dark:text-emerald-300",
    bar: "text-emerald-500 dark:text-emerald-400",
    glow: "shadow-[0_0_40px_rgba(52,211,153,0.10)]",
    Icon: CheckCircle2,
  },
} as const;

const SPARK = "▁▂▃▄▅▆▇█";

export function HealthSummary({ open, inProgress, urgent, unassigned }: Stats) {
  const score = Math.min(100, Math.round(open * 4 + urgent * 10 + unassigned * 3 + inProgress * 2));
  const level = score >= 70 ? "heavy" : score >= 40 ? "busy" : "chill";
  const meta = LEVELS[level];

  const width = 28;
  const filled = Math.round((score / 100) * width);
  const gauge = "█".repeat(filled) + "░".repeat(width - filled);

  const vals = [open, inProgress, urgent, unassigned];
  const max = Math.max(...vals, 1);
  const signal = vals.map((v) => SPARK[Math.round((v / max) * (SPARK.length - 1))]).join(" ");

  return (
    <section className={`panel relative overflow-hidden rounded-2xl p-5 ${meta.glow}`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
            <meta.Icon className={`h-3.5 w-3.5 ${meta.text}`} />
            Queue health
          </div>
          <h2 className={`mt-1 text-2xl font-bold tracking-tight ${meta.text}`}>{meta.word}</h2>
          <p className="mt-1 text-sm text-[var(--text-3)]">{meta.blurb}</p>
        </div>

        <pre className="shrink-0 font-mono text-[12px] leading-5 text-[var(--text-3)]">
          <span className="text-[var(--text-muted)]">LOAD   </span>
          <span className={meta.bar}>▕{gauge}▏</span>
          <span className="text-[var(--text-2)]"> {score}%</span>
          {"\n"}
          <span className="text-[var(--text-muted)]">SIGNAL </span>
          <span className={meta.bar}>{signal}</span>
          {"\n"}
          <span className="text-[var(--text-faint)]">       open  prog  urg  unassn</span>
        </pre>
      </div>
    </section>
  );
}
