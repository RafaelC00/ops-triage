"use client";

import { useActionState, useState } from "react";
import { Sparkles } from "lucide-react";
import { createRequest, type CreateState } from "@/lib/actions";
import { Label, Input, Textarea, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { CATEGORIES, PRIORITIES, categoryLabel, priorityLabel } from "@/lib/labels";
import type { Category, Priority } from "@prisma/client";

export function NewRequestForm() {
  const [state, formAction, pending] = useActionState<CreateState, FormData>(createRequest, {});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("OTHER");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [triaging, setTriaging] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  async function suggest() {
    if (!title.trim()) {
      setHint("Add a title first, then I can suggest a priority and category.");
      return;
    }
    setTriaging(true);
    setHint(null);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        const s = await res.json();
        setCategory(s.category);
        setPriority(s.priority);
        setHint(`${s.source === "llm" ? "AI" : "Rules"} suggestion applied — ${s.rationale}`);
      } else {
        setHint("Could not generate a suggestion. Set priority and category manually.");
      }
    } catch {
      setHint("Could not reach the triage service. Set priority and category manually.");
    } finally {
      setTriaging(false);
    }
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary of the request" required />
      </div>

      <div>
        <Label htmlFor="requester">Requester</Label>
        <Input id="requester" name="requester" placeholder="Coworker who raised this" required />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's needed and any context…" />
      </div>

      <div className="rounded-lg border border-dashed border-cyan-500/20 bg-cyan-500/5 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-400">Not sure how to triage it?</p>
          <Button type="button" variant="secondary" size="sm" onClick={suggest} disabled={triaging}>
            <Sparkles className="h-4 w-4 text-cyan-400" />
            {triaging ? "Thinking…" : "Suggest triage"}
          </Button>
        </div>
        {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{categoryLabel[c]}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select id="priority" name="priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{priorityLabel[p]}</option>
            ))}
          </Select>
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ring-1 ring-inset ring-rose-500/20">{state.error}</p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create request"}</Button>
      </div>
    </form>
  );
}
