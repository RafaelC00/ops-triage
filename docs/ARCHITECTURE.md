# Architecture

## Overview
Ops Triage is an internal web app for request triage, built with Next.js 16 App Router, TypeScript, and Tailwind v4. It uses Prisma 6 with Neon Postgres for data, Auth.js v5 for authentication, and is deployed on Vercel.

## Rendering model
- React Server Components query Prisma directly for initial loads.
- Server Actions handle mutations with revalidation.
- Small client islands for filters, inline selects, and a command palette.
- Suspense streaming with skeleton fallbacks for progressive hydration.

## Authentication
- Auth.js v5 Credentials provider (email + bcrypt, JWT sessions).
- Edge-safe split config: `auth.config.ts` shared by middleware and `auth.ts`.
- Middleware protects `/dashboard`; every server action re-checks the session (defense in depth).
- RBAC enforces admin-only delete operations.

## Data layer
- Prisma 6 + Neon Postgres with connection pooling.
- `DATABASE_URL` for runtime, `DIRECT_URL` for migrations.
- Core models: `User`, `Request`, `Note`, `Event` (audit history).

## Triage helper
- Deterministic rules engine by default (offline, zero-cost).
- Optional LLM mode behind `TRIAGE_MODE` env flag with graceful fallback.

## Theming
- CSS variables driven by `html[data-theme]`.
- Light/dark toggle persisted in `localStorage`.
- Fonts: Geist Sans + Geist Mono.

## Project structure
- `src/app`: Routes and layouts.
- `src/components`: UI components + client islands.
- `src/lib`: Prisma, auth, actions, data, triage, and label utilities.
