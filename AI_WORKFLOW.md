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

## Multi-agent orchestration & token ledger

This was built with a small fleet of models, each given work suited to its strengths and cost.
Measured tokens are reported where the platform exposes them; the orchestrator figure is an
estimate (Claude Code does not expose an exact per-task counter).

| Agent | Model | Task | Tokens |
|---|---|---|---|
| **Susan** (orchestrator) | Claude Opus 4.7 | Architecture, data model, auth, server actions, theming, deploy, QA, integration | primary — estimated several-hundred-K, cache-heavy |
| Sub-agent A | Claude Sonnet | README + `.env.example` | 54,167 |
| Sub-agent B | Claude Sonnet | Voice console + ⌘K command palette | 51,120 |
| **Vibe** | Mistral devstral-medium | `ARCHITECTURE.md` (711) + triage unit tests (670) | ~1,381 |
| **Cipher** | Cursor Agent | Attempted the triage tests — Cursor free-tier quota exhausted → fell back to Vibe | n/a |
| **HERMES** | Claude Sonnet (OpenRouter) | Recruiter ETA + submission drafts | ~2,000 |

The routing principle: keep the expensive orchestrator on architecture and the security-sensitive
auth path; push self-contained, well-specified work (docs, the two command-deck components, the
test file) to cheaper models. When Cipher hit a hard quota wall mid-task, the work rerouted to Vibe
without losing momentum — the kind of graceful fallback a real team needs.

## Final fleet summary — the ~2-hour build

Everything above was orchestrated and shipped within the trial's ~2-hour timebox.

**Fleet (agent · model · contribution):**
- **Susan** — Claude Opus 4.7 (orchestrator): architecture, data model, auth, server actions, theming, deploy, QA, integration.
- **Sub-agent A** — Claude Sonnet: `README.md` + `.env.example` (54,167 tokens).
- **Sub-agent B** — Claude Sonnet: voice console + ⌘K command palette (51,120 tokens).
- **Vibe** — Mistral devstral-medium: `ARCHITECTURE.md` + triage unit tests (~1,381 tokens).
- **HERMES** — Claude Sonnet via OpenRouter: recruiter/communication drafts (~2,000 tokens).
- **Cipher** — Cursor Agent: dispatched for the tests; hit a free-tier quota wall → work rerouted to Vibe.

**Specialized skills, MCPs & tooling:**
- **Playwright MCP** — browser automation used to *provision the Neon Postgres database through the Vercel dashboard*, run end-to-end QA on the live deployment (auth, queue, ⌘K palette, theme toggle), and inspect the database via the Vercel Data Editor.
- **Multi-model agent CLIs** — Cursor Agent (Cipher), Mistral Vibe, and OpenRouter (HERMES) for delegated, cost-appropriate work.
- **Platform tooling** — Vercel CLI (deploy, environment variables, Neon storage), GitHub CLI, Prisma, and Vitest.

**Token totals:** delegated/measured work ≈ **108.7K tokens** across the cheaper models (≈ <$1); the Opus orchestrator was the dominant spend (Claude Code does not expose an exact counter).

**Shipped in the window:** a deployed, authenticated app (production + staging), Neon Postgres with seed data and an audit-history trail, server-side route *and* action protection, light/dark theming, Suspense streaming with skeletons, an ⌘K command palette, **8 passing unit tests**, and complete docs — across **12 chunked commits**.
