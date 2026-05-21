import Link from "next/link";
import { redirect } from "next/navigation";
import { ListChecks } from "lucide-react";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth-forms";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-semibold text-[var(--text)]">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-500 text-white">
            <ListChecks className="h-5 w-5" />
          </span>
          Ops Triage
        </Link>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-[var(--text)]">Sign in</h1>
          <p className="mb-5 mt-1 text-sm text-[var(--text-muted)]">Welcome back. Sign in to your queue.</p>
          <LoginForm />
        </div>
        <p className="mt-4 rounded-lg bg-[var(--surface)] px-3 py-2 text-center text-xs text-[var(--text-muted)]">
          Reviewer demo: <span className="font-mono">reviewer@cgk.test</span> / <span className="font-mono">Reviewer123!</span>
        </p>
      </div>
    </main>
  );
}
