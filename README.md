# Ops Triage

A small, authenticated internal tool for managing operations requests. Ops team members log in, submit requests on behalf of coworkers, and work through a prioritized queue — updating status, assigning owners, adding notes, and letting the built-in triage helper suggest a priority and category. The app ships with a deterministic rules engine (zero-cost, works offline) and an optional LLM-backed triage mode toggled by an environment flag.

---

## Live Demo

**URL:** https://ops-triage.vercel.app

| Account | Email | Password | Role |
|---------|-------|----------|------|
| CGK Reviewer | `reviewer@cgk.test` | `Reviewer123!` | ADMIN |
| Sam Operator | `member@cgk.test` | `Member123!` | USER |

> Self-registration is open — any visitor can create a USER account at `/register` and immediately access the dashboard.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| ORM | Prisma 6 |
| Database | Neon Postgres (pooled + direct connections) |
| Auth | Auth.js v5 (`next-auth@beta`) — Credentials provider |
| Icons | lucide-react |
| Deployment | Vercel + Vercel Storage (Neon integration) |

---

## Features

- **Public home page** with a sign-in / register call to action
- **Self-registration** — visitors sign up with name, email, and password (bcrypt-hashed, min 8 chars); account creation auto-signs them in
- **Authenticated dashboard** — request queue ordered by priority (URGENT first) then most recent
- **Queue stats** — live counts for open, in-progress, urgent, and unassigned requests
- **Filter + search** — filter by status, priority, or category; full-text search across title, description, and requester name
- **Create requests** — title, description, free-text requester name, category, and priority; validated server-side with Zod
- **Request detail** — inline status/priority selectors, owner assignment from team member list, notes thread, append-only event history (created, status changed, priority changed, owner changed, note added)
- **Triage helper** — `/api/triage` POST endpoint returns a suggested priority + category + rationale; rules engine by default, optional LLM mode via env flag
- **RBAC demo** — deleting a request is ADMIN-only; all other mutations are open to any authenticated USER

### Command-deck UI (the "advanced" layer)

A dark, developer-tool aesthetic (Cursor / Claude / VS Code inspired — Geist Sans + Geist Mono, hairline borders, cyan/violet accents):

- **ASCII queue-health hero** — a live load score (weighted from urgent/open/unassigned/in-progress) rendered as a status word ("HEAVY DAY" / "BUSY" / "CHILL & NORMAL") with an ASCII gauge + signal bars.
- **Voice console** (`Mic` orb, bottom-right) — a Jarvis-style panel with a live **circular audio spectrum** (Web Audio `AnalyserNode` on the mic) and **voice commands** (Web Speech API) to navigate and filter the queue. *Requires a Chromium-based browser + microphone permission; degrades gracefully where unsupported.*
- **⌘K command palette** — keyboard-first navigation and filtering, VS Code style.
- **System status bar** — monospace strip with request IP, last login, a live UTC clock, a critical-load indicator, and the `⌘K` hint.

---

## Local Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env and fill in all required values (see Environment Variables below)

# 3. Generate the Prisma client
pnpm prisma generate

# 4. Run migrations
pnpm prisma migrate deploy
# Or, for an interactive dev migration:
# pnpm prisma migrate dev

# 5. Seed the database (creates 2 test accounts + 12 sample requests)
pnpm exec tsx prisma/seed.ts

# 6. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with one of the seeded accounts or register a new one.

---

## Environment Variables

> **No secret values are committed to this repository.** Only `.env.example` (with blank or placeholder values) is tracked by git. Copy it to `.env` locally and never commit `.env`.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon **pooled** connection string — used by the app at runtime (via PgBouncer). Typically ends with `?pgbouncer=true&sslmode=require`. |
| `DIRECT_URL` | Yes | Neon **direct** (non-pooled) connection string — used by Prisma for migrations only, bypasses the pooler. |
| `AUTH_SECRET` | Yes | Random secret used by Auth.js to sign and verify JWT session tokens. Generate with `npx auth secret` or `openssl rand -base64 32`. |
| `TRIAGE_MODE` | No | `rules` (default) or `llm`. Controls which triage backend the `/api/triage` endpoint uses. Omit or set to `rules` for zero-cost offline operation. |
| `OPENROUTER_API_KEY` | No | OpenRouter API key. Only required when `TRIAGE_MODE=llm`. If the key is missing, the rules engine is used regardless of `TRIAGE_MODE`. |
| `TRIAGE_MODEL` | No | OpenRouter model ID for LLM triage. Defaults to `anthropic/claude-haiku-4.5` when unset. |

**On Vercel:** `DATABASE_URL` and `DIRECT_URL` are auto-injected when you connect a Neon database via the Vercel Storage integration. Set `AUTH_SECRET` and optionally `TRIAGE_MODE` in the Vercel project's Environment Variables settings (Settings → Environment Variables).

---

## Auth Architecture

**Provider:** Auth.js v5 Credentials provider — email + password. Passwords are hashed with bcrypt (cost 10) and stored in Postgres. Sessions use the JWT strategy (no database session table required).

**Why Credentials?** The app is an internal tool with a known, invited user base. A full OAuth flow adds unnecessary setup friction. Email/password with bcrypt and JWT is straightforward, auditable, and sufficient for this scope.

**Split config — Edge vs. Node:**

The auth configuration is split across two files to satisfy Next.js's Edge runtime constraint:

- `src/auth.config.ts` — edge-safe. Contains `pages`, `session.strategy`, the `authorized` callback (used by middleware), and the `jwt`/`session` callbacks that embed `id` and `role` into the token. No Prisma, no Node-only APIs. Imported by both the middleware and the Node runtime.
- `src/auth.ts` — Node runtime only. Spreads `authConfig` and attaches the Credentials provider, which performs the Prisma database lookup and bcrypt comparison. Exports `handlers`, `auth`, `signIn`, and `signOut`.
- `src/middleware.ts` — runs on the **Edge runtime**. Instantiates Auth.js using only `auth.config.ts` (not `src/auth.ts`). The `authorized` callback redirects unauthenticated users away from all `/dashboard/*` routes to `/login`. The middleware matcher is `["/dashboard/:path*"]`.

**Defense in depth:** Middleware is the first gate, but it is not the only one. Every server action in `src/lib/actions.ts` independently calls `requireUser()` (for any authenticated user) or `requireAdmin()` (for ADMIN role) before touching the database. This means a misconfigured route matcher or a direct server-action invocation cannot bypass auth.

**Session data:** The `jwt` callback embeds `id` and `role` into the JWT token on sign-in. The `session` callback surfaces them on `session.user` so server components and server actions can read role without an extra database round-trip.

**Sign-in page:** `/login`. The `pages.signIn` setting in `auth.config.ts` ensures all unauthenticated redirects land there. New users register at `/register`, which creates the account and signs them in immediately.

---

## Assumptions & Extensibility

The brief intentionally left several product details open. Here is what was assumed and how the architecture makes each easy to revisit:

**(a) Requester is a free-text field.** The `requester` column on `Request` is a plain `String`. This reflects the real-world case where coworkers who raise requests may not have accounts in the system — an ops team member logs the request on their behalf. If the team later wants requesters to be linked `User` records, the change is small: add a nullable `requesterId` foreign key to `Request`, keep the free-text field as a fallback display name, and update the create-request form. No existing data or business logic needs to change.

**(b) Collaborative desk model.** Any authenticated ops member (USER or ADMIN) can create requests, update status/priority, assign owners, and add notes. The only ADMIN-only action is `deleteRequest`, which demonstrates RBAC concretely without over-engineering it. This matches a shared desk where the whole team works the same queue. A narrower ownership model (e.g., only the assigned owner may edit a request) can be enforced by adding an ownership check inside `requireUser()` calls in `actions.ts` without touching the schema.

**(c) Triage is deterministic by default.** `src/lib/triage.ts` ships a regex-based rules engine as the default. It is zero-cost, works offline, produces consistent output, and is easy to unit test. Setting `TRIAGE_MODE=llm` and providing `OPENROUTER_API_KEY` switches the `/api/triage` endpoint to an LLM call (OpenRouter, defaulting to `anthropic/claude-haiku-4.5`). The LLM path falls back to the rules engine on any error, so the feature never hard-fails. Swapping the model or adding a second provider is a one-file change in `triage.ts`.

**(d) Enums are centralized and easy to extend.** `src/lib/labels.ts` is the single source of truth for the `PRIORITIES`, `STATUSES`, and `CATEGORIES` arrays, as well as their human-readable display labels and Tailwind badge styles. Adding a new enum value requires: (1) adding it to the Prisma schema, (2) running a migration, (3) adding it to the relevant array and record in `labels.ts`. Nothing else changes — validation schemas in `actions.ts` derive their allowed values from the same arrays at runtime.

The guiding principle: **ship fast, stay open.** Every assumption above can be reversed or extended with a bounded, localized change — no major rewrites required.

---

## Deployment

1. Push the repo to GitHub and import it into Vercel.
2. In the Vercel project, go to **Storage** and connect (or create) a **Neon** Postgres database. Vercel auto-injects `DATABASE_URL` and `DIRECT_URL` into the project environment.
3. Add `AUTH_SECRET` in **Settings → Environment Variables**. Generate a value with `npx auth secret` or `openssl rand -base64 32`.
4. Optionally set `TRIAGE_MODE=llm` and `OPENROUTER_API_KEY` if you want LLM-backed triage in production.
5. Deploy. After the first successful build, run the seed script once if you want the sample data loaded into the production database:

```bash
# With DATABASE_URL + DIRECT_URL pointing to production in your local .env:
pnpm exec tsx prisma/seed.ts
```

---

## What I'd Improve With More Time

- **Tests** — unit tests for the triage rules engine, integration tests for server actions with a test database, and end-to-end tests with Playwright.
- **Optimistic UI** — status and priority selects currently require a server round-trip; optimistic updates via `useOptimistic` would make them feel instant.
- **Pagination** — the request queue fetches all matching rows; a cursor-based or offset pagination strategy is needed at scale.
- **Email notifications** — notify the assigned owner and the request creator on status changes or new notes.
- **Real-time updates** — polling or server-sent events so the dashboard queue refreshes automatically when a teammate changes a request.
- **Row-level security at the DB layer** — Neon supports Postgres RLS; enforcing access rules at the database level would add a meaningful security layer independent of the application guards.
- **Audit log UI improvements** — the event history is append-only and accurate, but a visual timeline with actor avatars would be more readable at a glance.
