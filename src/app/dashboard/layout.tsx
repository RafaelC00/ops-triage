import Link from "next/link";
import { ListChecks, Plus, LogOut } from "lucide-react";
import { auth, signOut } from "@/auth";
import { buttonClasses } from "@/components/ui/button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-600 text-white">
              <ListChecks className="h-4 w-4" />
            </span>
            Ops Triage
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/new" className={buttonClasses("primary", "sm")}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New request</span>
            </Link>

            <span className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
              {user?.name ?? user?.email}
              {user?.role === "ADMIN" && (
                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                  Admin
                </span>
              )}
            </span>

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
    </div>
  );
}
