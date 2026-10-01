import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { triage } from "@/lib/triage";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(""),
});

// Protected: signed-out callers get 401, never reaching the triage logic.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const suggestion = await triage(parsed.data.title, parsed.data.description);
  return NextResponse.json(suggestion);
}
