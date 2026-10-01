import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MessageSquare } from "lucide-react";
import { getRequest, listMembers } from "@/lib/data";
import { auth } from "@/auth";
import { updateStatus, updatePriority, assignOwner, addNote, deleteRequest } from "@/lib/actions";
import { InlineSelect } from "@/components/inline-select";
import { NoteForm } from "@/components/note-form";
import { DeleteRequestButton } from "@/components/delete-request-button";
import { PriorityBadge, StatusBadge, CategoryBadge } from "@/components/badges";
import { Label } from "@/components/ui/field";
import { STATUSES, PRIORITIES, statusLabel, priorityLabel } from "@/lib/labels";
import { formatDateTime, relativeTime } from "@/lib/utils";
import type { Status, Priority } from "@prisma/client";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [request, members, session] = await Promise.all([getRequest(id), listMembers(), auth()]);
  if (!request) notFound();
  const isAdmin = session?.user.role === "ADMIN";

  // Bound server actions (each re-checks the session inside actions.ts).
  const setStatus = async (v: string) => {
    "use server";
    await updateStatus(id, v as Status);
  };
  const setPriority = async (v: string) => {
    "use server";
    await updatePriority(id, v as Priority);
  };
  const setOwner = async (v: string) => {
    "use server";
    await assignOwner(id, v || null);
  };
  const note = async (body: string) => {
    "use server";
    await addNote(id, body);
  };
  const remove = async () => {
    "use server";
    await deleteRequest(id);
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-2)]">
        <ArrowLeft className="h-4 w-4" />
        Back to queue
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">{request.title}</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Raised by {request.requester} · opened {formatDateTime(request.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge value={request.priority} />
          <StatusBadge value={request.status} />
          <CategoryBadge value={request.category} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[var(--text)]">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-3)]">
              {request.description || "No description provided."}
            </p>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <MessageSquare className="h-4 w-4 text-[var(--text-3)]" /> Notes
            </h2>
            <div className="mt-3 space-y-3">
              {request.notes.length === 0 && <p className="text-sm text-[var(--text-3)]">No notes yet.</p>}
              {request.notes.map((n) => (
                <div key={n.id} className="rounded-lg bg-[var(--surface)] p-3">
                  <p className="text-sm text-[var(--text-2)]">{n.body}</p>
                  <p className="mt-1 text-xs text-[var(--text-3)]">
                    {n.author.name ?? n.author.email} · {relativeTime(n.createdAt)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <NoteForm action={note} />
            </div>
          </section>
        </div>

        {/* Side column: controls + history */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[var(--text)]">Triage</h2>
            <div className="mt-3 space-y-4">
              <div>
                <Label htmlFor="status-select">Status</Label>
                <InlineSelect
                  label="Status"
                  value={request.status}
                  action={setStatus}
                  options={STATUSES.map((s) => ({ value: s, label: statusLabel[s] }))}
                />
              </div>
              <div>
                <Label htmlFor="priority-select">Priority</Label>
                <InlineSelect
                  label="Priority"
                  value={request.priority}
                  action={setPriority}
                  options={PRIORITIES.map((p) => ({ value: p, label: priorityLabel[p] }))}
                />
              </div>
              <div>
                <Label htmlFor="owner-select">Owner</Label>
                <InlineSelect
                  label="Owner"
                  value={request.ownerId ?? ""}
                  action={setOwner}
                  options={[
                    { value: "", label: "Unassigned" },
                    ...members.map((m) => ({ value: m.id, label: m.name ?? m.email })),
                  ]}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <Clock className="h-4 w-4 text-[var(--text-3)]" /> History
            </h2>
            <ol className="mt-3 space-y-3">
              {request.events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--text-3)]" />
                  <div>
                    <p className="text-sm text-[var(--text-2)]">{e.message}</p>
                    <p className="text-xs text-[var(--text-3)]">
                      {e.actor.name ?? e.actor.email} · {relativeTime(e.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {isAdmin && (
            <section className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
              <h2 className="text-sm font-semibold text-rose-700 dark:text-rose-300">Admin</h2>
              <p className="mt-1 text-xs text-rose-400/80">Permanently delete this request.</p>
              <div className="mt-3">
                <DeleteRequestButton action={remove} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
