import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewRequestForm } from "@/components/new-request-form";

export default function NewRequestPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-2)]">
        <ArrowLeft className="h-4 w-4" />
        Back to queue
      </Link>
      <h1 className="text-xl font-semibold text-[var(--text)]">New request</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Log a request and set its priority so the team can triage it.</p>
      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <NewRequestForm />
      </div>
    </div>
  );
}
