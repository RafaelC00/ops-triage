import Link from "next/link";
import { ListChecks, ShieldCheck, Sparkles, Filter, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { buttonClasses } from "@/components/ui/button";

const features = [
  {
    icon: ListChecks,
    title: "One shared queue",
    body: "Every coworker request in one place — title, requester, category, priority, status, and owner at a glance.",
  },
  {
    icon: Filter,
    title: "Triage fast",
    body: "Search and filter by status, priority, and category to decide what to handle next.",
  },
  {
    icon: Sparkles,
    title: "Smart suggestions",
    body: "A built-in triage helper proposes a priority and category so nothing slips through.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "The dashboard and every action are protected server-side. Signed-out visitors see nothing.",
  },
];

export default async function Home() {
  const session = await auth();
  const signedIn = !!session?.user;

  return (
    <main className="flex-1">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">
            <ListChecks className="h-5 w-5" />
          </span>
          Ops Triage
        </div>
        <Link href={signedIn ? "/dashboard" : "/login"} className={buttonClasses("secondary", "sm")}>
          {signedIn ? "Open dashboard" : "Sign in"}
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-16 pt-10 sm:pt-16">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
            Internal operations
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Triage coworker requests without the chaos.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Ops Triage gives your operations team a single, focused queue to capture incoming
            requests, set priority and status, and always know what to handle next.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={signedIn ? "/dashboard" : "/login"} className={buttonClasses("primary", "md")}>
              {signedIn ? "Go to dashboard" : "Sign in to get started"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {!signedIn && (
              <Link href="/register" className={buttonClasses("ghost", "md")}>
                Create an account
              </Link>
            )}
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-6 py-8 text-sm text-slate-400">
        Ops Triage — a focused internal tool.
      </footer>
    </main>
  );
}
