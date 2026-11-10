# AGENTS.md

Generic, fully adjustable single-user triathlon training-plan app (availability, optional strength, performance inputs → estimates, A/B/C races, QoL features). Seed example and main test fixture: Wisnu, **IRONMAN 70.3 Da Nang, 9 May 2027**, goal tiers cut-offs → sub-6:30 → stretch sub-6:00; strong runner (HM 1:39, M 3:49), cycling novice with no bike yet, near-novice swimmer. Full spec, sourced rules and milestones (M0–M22): `PLAN.md`. Conventions: `.cursor/rules/*.mdc`.

## Commands
- `npm run dev` — local app
- `npm test` — Vitest (training logic)
- `npx tsc --noEmit` — type check
- `npm run lint` — ESLint
- `npx prisma migrate dev` / `npx prisma db seed` — DB + seed from `seed/athlete-profile.json`

## Canonical files
- `src/lib/training/constants.ts` — all numbers, each with a SOURCE comment
- `src/lib/training/*.test.ts` — examples of expected behaviour; read these before changing logic

## Guardrails
- One milestone per task; stay inside its files. Phase A (pure logic) before UI.
- Don't edit committed tests to make them pass.
- Personal fitness values in the seed are `null` until Wisnu enters test results — handle `null` (show "test needed"), never fabricate defaults.
- Safety beats speed: never generate solo open-water swims or outdoor rides before the bike skill checkpoints allow it.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
