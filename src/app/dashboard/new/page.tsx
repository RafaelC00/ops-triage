import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewRequestForm } from "@/components/new-request-form";

export default function NewRequestPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Back to queue
      </Link>
      <h1 className="text-xl font-semibold text-slate-900">New request</h1>
      <p className="mt-1 text-sm text-slate-500">Log a request and set its priority so the team can triage it.</p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <NewRequestForm />
      </div>
    </div>
  );
}
