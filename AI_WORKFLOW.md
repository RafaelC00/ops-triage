# AI Workflow

This project was built AI-native, end to end, in a single focused evening. The point of this
document is to show *how* AI was used with engineering judgment — not to hide it, and not to
outsource the decisions.

## Tools

- **Claude Code (Claude Opus 4.7)** — primary driver / orchestrator. Architecture, data model,
  authentication, server actions, deployment, and QA were done here.
- **Two Claude (Sonnet) sub-agents**, spawned for bounded, parallelizable work while the
  orchestrator kept building:
  - Sub-agent A — drafted `README.md` + `.env.example` by reading the codebase.
  - Sub-agent B — built the two self-contained "advanced" client components (voice console +
    command palette) against a precise spec.
- The sub-agents ran in **parallel** with the main thread, then their output was reviewed,
  type-checked, and integrated by the orchestrator.

## How it was built (phases)

1. **Read the brief, set the architecture.** Chose Next.js (App Router, RSC-first) + Auth.js
   (Credentials) + Prisma + Neon Postgres + Vercel. The deciding factor for the stack was the
   brief's emphasis on authentication: one trust boundary (server-side `auth()` guards) protects
   both routes (middleware) and mutations (every server action re-checks).
2. **Backend first.** Schema → migration → seed → auth config → server actions → data layer →
   triage engine → protected API route. Verified with `pnpm build` before any UI existed.
3. **UI as React Server Components.** The queue, detail, and dashboard fetch Prisma directly —
   no client-side data waterfalls. Mutations use Server Actions. The only client islands are the
   filters, inline selects, note form, command palette, and voice console.
4. **Ship a working baseline, then layer polish.** Deployed a functional version to Vercel and
   verified login + data live *before* investing in the dark "command-deck" theme, voice console,
   ⌘K palette, status bar, and ASCII health hero. This guaranteed a working deliverable at every
   step.

## AI suggestions I rejected or changed

- **Pinned Prisma to v6 instead of the v7 the tooling pulled in.** `create-next-app` + "latest"
  resolved Prisma 7, which moves datasource URLs out of the schema and requires driver adapters.
  In a timeboxed build, I judged the bleeding-edge default to be unnecessary risk and pinned to
  the battle-tested Prisma 6. Stability over novelty — and documented as a deliberate choice.
- **Caught and fixed a bad bulk edit.** A `sed`-based theme restyle double-matched one class
  (`bg-rose-50/40` → `bg-rose-500/100/5`). The post-edit grep + build surfaced it and I corrected
  it by hand. AI-assisted mechanical edits get *reviewed*, not trusted blindly.
- **Disabled Neon's bundled auth.** Vercel's Neon integration offered built-in authentication; I
  turned it off because the app standardizes on Auth.js. Avoiding a second, unused auth system
  (and its env vars) kept the stack coherent and the env surface clean.
- **Rules-engine triage by default, LLM opt-in.** The "AI-first" framing tempts an always-on LLM
  call. I made the deterministic rules engine the default (zero-cost, offline, testable) and put
  the LLM behind an env flag with a graceful fallback — the judgment call the brief actually rewards.

## Verification

- **`pnpm build` (TypeScript strict)** run repeatedly across iterations — green at every commit.
- **Live QA on the deployed app** (not just localhost): signed in as `reviewer@cgk.test`, confirmed
  the dashboard renders the 12 seeded requests with correct stats, opened the ⌘K palette, and
  confirmed server-side auth + the Neon database both work in production.
- **Commit history** is intentionally chunked by concern (data model + auth → server actions /
  data / triage → UI → command-deck features → health hero) rather than one giant commit.

## Fleet usage (token transparency)

Measured where the platform reports it; the orchestrator figure is an estimate (Claude Code does
not expose an exact per-task counter).

| Agent | Model | Role | Tokens |
|---|---|---|---|
| Orchestrator | Claude Opus 4.7 | Architecture, backend, auth, theme, deploy, QA | ~ (primary; estimated few-hundred-K, cache-heavy) |
| Sub-agent A | Claude Sonnet | README + `.env.example` | 54,167 (measured) |
| Sub-agent B | Claude Sonnet | Voice console + ⌘K palette | 51,120 (measured) |

Delegating the docs and the two self-contained components to cheaper Sonnet sub-agents kept the
expensive orchestrator focused on architecture and the security-sensitive auth path — the same
cost/judgment trade-off I'd make on a real team.
