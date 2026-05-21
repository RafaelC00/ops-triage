import Link from "next/link";
import { redirect } from "next/navigation";
import { ListChecks } from "lucide-react";
import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth-forms";

export default async function RegisterPage() {
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
          <h1 className="text-lg font-semibold text-slate-900">Create your account</h1>
          <p className="mb-5 mt-1 text-sm text-slate-500">Join your team&apos;s triage queue.</p>
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
