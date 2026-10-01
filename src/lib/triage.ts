import type { Category, Priority } from "@prisma/client";

export type TriageSuggestion = {
  priority: Priority;
  category: Category;
  rationale: string;
  source: "rules" | "llm";
};

// ── Rules engine ───────────────────────────────────────────────────────────
// Deterministic, zero-cost, works offline. Default triage provider.
const URGENT_HINTS = [
  /\bdown\b/i, /outage/i, /security/i, /breach/i, /payroll/i, /leak/i,
  /safety/i, /can'?t (log|access|connect)/i, /\busgent\b|\burgent\b/i, /asap/i, /offline/i,
];
const HIGH_HINTS = [
  /deadline/i, /tomorrow/i, /today/i, /friday|monday|thursday/i, /blocked/i,
  /invoice/i, /new hire/i, /client/i, /duplicate/i, /permission/i,
];

const CATEGORY_HINTS: Record<Category, RegExp[]> = {
  IT: [/vpn|laptop|email|slack|password|server|wifi|network|software|drive|account/i],
  FACILITIES: [/projector|desk|room|coffee|hvac|light|door|office|building/i],
  HR: [/hire|onboard|pto|policy|benefits|payroll|employee|accommodation/i],
  FINANCE: [/invoice|expense|reimburse|payment|budget|vendor|ap\b|ar\b/i],
  LOGISTICS: [/pallet|carrier|shipment|warehouse|freight|inventory|dock|oms/i],
  OTHER: [],
};

function pickCategory(text: string): Category {
  for (const cat of ["IT", "FACILITIES", "HR", "FINANCE", "LOGISTICS"] as Category[]) {
    if (CATEGORY_HINTS[cat].some((re) => re.test(text))) return cat;
  }
  return "OTHER";
}

export function ruleTriage(title: string, description: string): TriageSuggestion {
  const text = `${title} ${description}`;
  let priority: Priority = "MEDIUM";
  const reasons: string[] = [];

  if (URGENT_HINTS.some((re) => re.test(text))) {
    priority = "URGENT";
    reasons.push("mentions an outage, security, safety or access-blocking issue");
  } else if (HIGH_HINTS.some((re) => re.test(text))) {
    priority = "HIGH";
    reasons.push("references a deadline, blocker or business-impacting item");
  } else {
    reasons.push("no urgency or deadline signals detected");
  }

  const category = pickCategory(text);
  reasons.push(category === "OTHER" ? "no clear category keywords" : `keywords map to ${category}`);

  return {
    priority,
    category,
    rationale: reasons.join("; ") + ".",
    source: "rules",
  };
}

// ── Optional LLM provider ──────────────────────────────────────────────────
// Activated only when TRIAGE_MODE=llm and OPENROUTER_API_KEY is set. Falls back
// to the rules engine on any error so the feature never hard-fails.
async function llmTriage(title: string, description: string): Promise<TriageSuggestion> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.TRIAGE_MODEL || "anthropic/claude-haiku-4.5",
      messages: [
        {
          role: "system",
          content:
            "You triage internal operations requests. Reply ONLY with compact JSON: " +
            '{"priority":"LOW|MEDIUM|HIGH|URGENT","category":"IT|FACILITIES|HR|FINANCE|LOGISTICS|OTHER","rationale":"one sentence"}.',
        },
        { role: "user", content: `Title: ${title}\nDescription: ${description}` },
      ],
      temperature: 0,
      max_tokens: 120,
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}`);
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  return {
    priority: parsed.priority,
    category: parsed.category,
    rationale: parsed.rationale,
    source: "llm",
  };
}

export async function triage(title: string, description: string): Promise<TriageSuggestion> {
  if (process.env.TRIAGE_MODE === "llm" && process.env.OPENROUTER_API_KEY) {
    try {
      return await llmTriage(title, description);
    } catch {
      return ruleTriage(title, description);
    }
  }
  return ruleTriage(title, description);
}
