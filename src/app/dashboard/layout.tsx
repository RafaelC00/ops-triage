import Link from "next/link";
import { headers } from "next/headers";
import { ListChecks, Plus, LogOut } from "lucide-react";
import { auth, signOut } from "@/auth";
import { getQueueStats } from "@/lib/data";
import { buttonClasses } from "@/components/ui/button";
import { StatusBar } from "@/components/status-bar";
import { CommandPalette } from "@/components/command-palette";
import { VoiceConsole } from "@/components/voice-console";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [session, stats, h] = await Promise.all([auth(), getQueueStats(), headers()]);
  const user = session?.user;
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "127.0.0.1").trim();

  return (
    <div className="flex min-h-full flex-col">
      <StatusBar ip={ip} loginAt={user?.loginAt} urgent={stats.urgent} />

      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-[var(--text)]">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-500 text-slate-950">
              <ListChecks className="h-4 w-4" />
            </span>
            Ops Triage
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/new" className={buttonClasses("primary", "sm")}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New request</span>
            </Link>

            <span className="hidden items-center gap-2 text-sm text-[var(--text-muted)] sm:flex">
              {user?.name ?? user?.email}
              {user?.role === "ADMIN" && (
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
                  Admin
                </span>
              )}
            </span>

            <ThemeToggle />

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className={buttonClasses("ghost", "sm")} title="Sign out">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>

      {/* Global command-deck features */}
      <CommandPalette />
      {/* Voice console is gated to staging while the speech-recognition UX is refined. */}
      {process.env.NEXT_PUBLIC_ENABLE_VOICE === "true" && <VoiceConsole />}
    </div>
  );
}
