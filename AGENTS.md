# AGENTS.md

Generic, fully adjustable single-user triathlon training-plan app (availability, optional strength, performance inputs → estimates, A/B/C races, QoL features). Seed example and main test fixture: Wisnu, **IRONMAN 70.3 Da Nang, 9 May 2027**, goal tiers cut-offs → sub-6:30 → stretch sub-6:00; strong runner (HM 1:39, M 3:49), cycling novice with no bike yet, near-novice swimmer. Full spec, sourced rules and milestones (M0–M26): `PLAN.md`. UI layout, design system and components: `DESIGN.md` + `design/tokens.css`. Conventions: `.cursor/rules/*.mdc`.

## Commands
- `npm run dev` — local app
- `npm test` — Vitest (training logic)
- `npx tsc --noEmit` — type check
- `npm run lint` — ESLint
- `npx prisma migrate dev` / `npx prisma db seed` — DB + seed from `seed/athlete-profile.json`

## Canonical files
- `src/lib/training/constants.ts` — all numbers, each with a SOURCE comment
- `src/lib/training/*.test.ts` — examples of expected behaviour; read these before changing logic
- `DESIGN.md`, `design/tokens.css`, `design/mockups/*.png` — UI contract; `src/components/ui/` once M14 exists

## Guardrails
- One milestone per task; stay inside its files. Phase A (pure logic) before UI.
- Don't edit committed tests to make them pass.
- Personal fitness values in the seed are `null` until Wisnu enters test results — handle `null` (show "test needed"), never fabricate defaults.
- UI uses design tokens only (no raw hex, no default Tailwind palette); build components (M14) before screens.
- Safety beats speed: never generate solo open-water swims or outdoor rides before the bike skill checkpoints allow it.
