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
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-semibold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">
            <ListChecks className="h-5 w-5" />
          </span>
          Ops Triage
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>
          <p className="mb-5 mt-1 text-sm text-slate-500">Welcome back. Sign in to your queue.</p>
          <LoginForm />
        </div>
        <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-center text-xs text-slate-500">
          Reviewer demo: <span className="font-mono">reviewer@cgk.test</span> / <span className="font-mono">Reviewer123!</span>
        </p>
      </div>
    </main>
  );
}
