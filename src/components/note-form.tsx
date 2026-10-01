"use client";

import { useRef, useTransition } from "react";
import { Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function NoteForm({ action }: { action: (body: string) => Promise<void> }) {
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const value = ref.current?.value ?? "";
        if (!value.trim()) return;
        startTransition(async () => {
          await action(value);
          if (ref.current) ref.current.value = "";
        });
      }}
      className="space-y-2"
    >
      <Textarea ref={ref} name="body" placeholder="Add a note for the team…" required />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add note"}
        </Button>
      </div>
    </form>
  );
}
