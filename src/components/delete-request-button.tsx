"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteRequestButton({ action }: { action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this request? This cannot be undone.")) {
          startTransition(() => action());
        }
      }}
    >
      <Trash2 className="h-4 w-4" />
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
