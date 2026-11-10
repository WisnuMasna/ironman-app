# DESIGN: UI layout template & design system

> Feed with `@DESIGN.md` together with `@design/tokens.css` for any UI milestone (M13 onward, see PLAN.md §10).
> Working name in mockups: **Tri-plan**. Mobile-first (390 × 844 reference), light + dark, en-AU copy.
> Reference app: Runna's friendly layout was studied from public sources (§1). This design borrows **patterns**, not assets: no Runna name, logo, icons, illustrations, copy or colour values appear anywhere in the app.

---

## 1. Reference research: what Runna does (public sources only, fetched 10 Nov 2026)

### 1.1 What I actually saw or read
| Pattern | Evidence | Source |
|---|---|---|
| **Plan home card**: plan name, race name and date, a segmented progress strip, "Weeks completed 2/19" and "Distance 54/600 mi"; a row of round shortcut buttons (Current Week, Plan Overview, Connected Apps, Manage Plan); an insight card ("Pace on point") and an "Estimated marathon time" range (e.g. 4:10:00–4:17:00). | App Store screenshot 3 | [App Store listing][as] |
| **Bottom tab bar** with 5 tabs: Today, Plan, Activities, Community, Support. | App Store screenshot 3 | [as] |
| **Training calendar (week list)**: week header "10 Feb – 16 Feb" with a **WEEK 2** pill and "Total: 5.1 / 29.5 mi"; one row per day (weekday + date on the left), workout cards with a **coloured left edge per workout type**, distance/duration line, tick on completed workouts, **"+ Add"** on each day, a **Reset** button per week, Save at the top. | App Store screenshot 5 ("Move workouts whenever you want") | [as] |
| **Workout-type colour coding**: tiles for Easy Run, Tempo, Intervals, Hill, Long Run, Time Trial, Parkrun, Race, plus Strength, Pilates, Mobility; each type has its own bright colour/gradient tile with an icon. | App Store screenshot 4 ("Choose a workout") | [as] |
| **Onboarding**: "What is your goal?" list of large option rows with an icon (Race, Run a specific distance, first 5k, general training, post-natal, functional fitness, post-injury, post-race recovery); a thin progress bar at the top with back and close; a summary step "Set your training preferences" showing Training volume = Progressive, Difficulty = Challenging, an "Edit preferences" link and a full-width **Continue** button. | App Store screenshots 1 and 6 | [as] |
| Overall look in all screenshots: **dark UI**, near-black background, dark-grey rounded cards, white text, bold geometric sans headings, white pill CTA, colour used mainly for workout types. | All 6 App Store screenshots | [as] |
| Weekly breakdown at the top of the main screen with run days marked and a weekly **progress scale that fills as you complete sessions**; workouts guide warm-up → main → cool-down; you can scroll ahead and **move runs to other days**; a **race countdown** at the bottom of the main page; every workout has a written **purpose**; **outdoor vs treadmill** toggle converts pace targets. | Runner's World review | [rw] |
| Onboarding asks running level, a recent race time, how often and **which days** you run; the plan overview shows completed vs remaining sessions and weekly km; notes and a photo can be added after a run. | Tom's Guide review | [tg] |
| Detailed onboarding quiz incl. weekly availability; a **pre-paywall summary** of choices; workout screens with warm-up/cool-down and outdoor/treadmill options; manual activity logging; post-workout insights. A reviewer notes settings are split confusingly and the long quiz could use a clearer progress indicator. | ScreensDesign breakdown | [sd] |
| Features: personalised plans, device sync, strength & mobility alongside running, estimated race time calculator. | Runna website, App Store description | [web], [as] |

### 1.2 What I could not verify
- I did not see a full **workout-detail screen with structured interval steps** in any screenshot I could open; only reviews describe warm-up/main/cool-down. The Uiland and dezzayn galleries are behind sign-in/JS walls, so I didn't use them.
- No light-mode screens, exact typefaces, colour values, spacing, animations, or the progress/stats screens. Nothing below copies any of those.
- No triathlon-specific views: the App Store text mentions "plans for triathlon running" only.

### 1.3 What we take (patterns) vs what we change
| Take (generic UX pattern) | Change for a triathlon plan app |
|---|---|
| A home card that answers "where am I in the plan?" (countdown + progress) | Add **goal-tier badges** (cut-offs / sub-6:30 / sub-6) with honest states incl. "needs data", and a **phase bar** (Prep→Taper) instead of a plain strip |
| A week list with day rows and a coloured edge per session | **Multi-sport day stacking** (2 sessions/day), colour by **sport** (swim/bike/run/strength/brick) while **intensity** gets its own zone scale; per-week sport-hours bar |
| A per-workout purpose line and warm-up → main → cool-down steps | **Structured step list with intensity bars**, a **brick view** with a T2 step and sport baseline, fuelling and heat cards |
| Moving workouts between days | Moves validated by the generator (rest days, `maxMinutes`, strength spacing); **Move** button as the non-drag alternative (WCAG 2.5.7) |
| A short summary step at the end of onboarding | The summary shows **feasibility warnings** (availability vs cut-offs) before the plan exists, not a paywall |
| Estimated race time | **Predicted finish trend** with tier lines, range band and **B-race benchmarks**; per-leg breakdown with the weakest leg named |
| Dark, card-based, friendly | **Light by default + full dark theme**, original palette, all pairs measured against WCAG |

---

## 2. Design principles
1. **Today first.** Opening the app answers in one glance: *what do I do today, how hard, and am I on track?*
2. **Sport is identity, zone is effort.** Sport colours mark *what*; the Z1–Z5 scale marks *how hard*. Never mix the two scales.
3. **Honest states.** "Needs data", "test needed", "estimated" and "illustrative" are first-class UI states. Never show a fake-precise number.
4. **Safety and cut-offs are visible, not buried.** Skill checkpoints, open-water safety and cut-off margins show where the decision is made.
5. **Warnings come with a fix.** Every `warnings[]` item renders as a banner with a one-tap fix hint (PLAN.md §8.9).
6. **Calm density.** One hero metric per card, max two lines of meta per session, generous 16 px gutters.
7. **One clear next step.** Each screen has exactly one filled primary button; everything else is secondary or a link.
8. **Plain words first, jargon second.** Every term has a plain label and a tap-to-explain glossary entry; nothing is lost if you skip it.
9. **Forgiving.** Every move, skip, edit and log can be undone; missed time leads to *Ease me back in*, never a guilt pile.
10. **Accessible by default.** WCAG 2.2 AA contrast, 44 px tap targets, colour never the only signal (icon + label always), no drag-only actions, reduced-motion support.

---

## 3. Design system

Files: **`design/tokens.css`** (all raw tokens, light + dark) and **`design/tailwind-theme.css`** (Tailwind v4 `@theme inline` mapping + data-attribute dark variant). Tailwind v4 is configured in CSS, not a JS preset ([Tailwind theme docs][tw-theme], [dark mode docs][tw-dark]).

### 3.1 Colour: neutrals & brand
| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F4F5F7` | `#0E1116` | App background |
| `--surface` | `#FFFFFF` | `#161A21` | Cards, sheets, tab bar |
| `--surface-2` / `-3` | `#ECEEF2` / `#E2E6EC` | `#1E232C` / `#272D38` | Inset rows, inputs, tracks / pressed |
| `--border` | `#D5DAE1` | `#2B323D` | Decorative dividers only |
| `--border-strong` | `#7F8999` | `#5E6878` | Input outlines, control edges (≥ 3:1) |
| `--text` / `--text-muted` / `--text-faint` | `#11151B` / `#566070` / `#6B7584` | `#F1F3F6` / `#A1AAB8` / `#858F9E` | Body / secondary / captions |
| `--primary` ("Dawn indigo") | `#3D3AD9` | `#8C89FF` | CTAs, selection, today, links |
| `--on-primary` | `#FFFFFF` | `#0E1116` | Text on primary |

### 3.2 Colour: sports
| Sport | Fill (light / dark) | Ink = text-safe (light / dark) | Soft tint (light / dark) | Icon |
|---|---|---|---|---|
| Swim | `#1A8FD0` / `#3CB2EE` | `#0B6EA6` / `#6CC6F2` | `#E3F2FB` / `#12293A` | swimmer over waves |
| Bike | `#C98200` / `#F6B23A` | `#8F5A00` / `#F8C566` | `#FBF0DC` / `#2E2410` | bicycle |
| Run | `#EE5536` / `#FF7458` | `#B83A1F` / `#FF9682` | `#FDE9E4` / `#33191A` | runner |
| Strength | `#9A6CF2` / `#AE8BFF` | `#6A3BD1` / `#C2A8FF` | `#EFE8FD` / `#241C3D` | dumbbell |
| Brick | split **bike → run** (diagonal tile, vertical stripe) | — | — | bike icon on split tile |
| Rest | `#7C8698` / `#7D8798` | `--text-muted` | `--surface-2` | moon |
Rules: fills carry **icons**, not body text; text on a fill uses `--on-sport`; sport-coloured text uses the `*-ink` token.

### 3.3 Colour: intensity zones and status
- **Zones** `--z1…--z5` (light `#7A869C #1F8F66 #A88400 #D2621A #D03350`, dark `#7F8BA0 #45C892 #EBCB4E #F59A50 #F2647A`): recovery grey → endurance green → tempo yellow → threshold orange → VO2 red. One generic 5-step scale across sports; sport-specific zone numbers (Coggan 7 levels, Friel 5a/b/c) map onto it in `src/lib/training/zones.ts` (mapping is `project default, tune`). **Skill-mode** steps use a dashed swim-blue bar (`--z-skill`), never a zone colour.
- **Status**: `--success` on track, `--warning` at risk, `--danger` off track / cut-off risk, `--info` neutral notes, `--heat` heat notes; each has a `-soft` background.

### 3.4 Accessibility contrast (WCAG ratio, computed from tokens)
Targets: text ≥ 4.5:1, large text ≥ 3:1 ([WCAG 1.4.3][wcag-143]); UI components and graphics ≥ 3:1 ([WCAG 1.4.11][wcag-1411]).
| Pair | Light | Dark |
|---|---|---|
| `--text` on `--surface` | 18.3 | 15.7 |
| `--text-muted` on `--surface` | 6.4 | 7.4 |
| `--text-faint` on `--surface` (captions) | 4.7 | 5.3 |
| `--primary` on `--surface` | 7.5 | 5.9 |
| `--on-primary` on `--primary` | 7.5 | 6.4 |
| `--swim/bike/run/strength-ink` on `--surface` | 5.5 / 5.8 / 5.7 / 6.6 | 9.1 / 10.9 / 8.3 / 8.6 |
| `--success / --warning / --danger` on own `-soft` | 4.7 / 4.5 / 5.1 | 6.7 / 7.9 / 5.6 |
| `--heat` on `--heat-soft` | 4.6 | 7.3 |
| `--on-sport` on swim / bike / run / strength fill | 5.1 / 5.8 / 5.2 / 5.1 | 7.9 / 10.2 / 7.1 / 7.1 |
| Sport fills on `--surface` (non-text) | 3.6 / 3.1 / 3.5 / 3.6 | 7.3 / 9.4 / 6.6 / 6.6 |
| Zone fills Z1–Z5 on `--surface` (non-text) | 3.7 / 4.1 / 3.5 / 3.8 / 4.9 | 5.1 / 8.2 / 11.0 / 8.0 / 5.7 |
| `--border-strong` on `--surface` | 3.5 | 3.1 |
Also: tap targets ≥ 44 px (`--tap-min`, a project default above the 24 px floor of [WCAG 2.5.8][wcag-258]); every drag action has a single-tap alternative ([WCAG 2.5.7][wcag-257]); `prefers-reduced-motion` zeroes durations. Re-run the contrast check in M13 when a token changes.

### 3.5 Typography
- **UI:** Plus Jakarta Sans (OFL, Google Fonts). Friendly geometric sans with sturdy bold weights.
- **Numbers:** Barlow Semi Condensed (OFL) with `tabular-nums` for times, paces, countdowns and table figures, so columns don't jitter.
- Load both with `next/font/google`, exposed as `--font-jakarta` / `--font-barlow`; tokens fall back to system fonts.
| Token | Size / line | Weight | Use |
|---|---|---|---|
| `display` | 40 / 44 | 700 numeric | Hero metric (days to go, predicted finish) |
| `h1` | 28 / 34 | 800 | Screen titles |
| `h2` | 22 / 28 | 800 | Detail titles |
| `h3` | 18 / 24 | 700 | Section headers, week title |
| `body` | 16 / 24 | 400–700 | Default, session titles (700) |
| `sm` | 14 / 20 | 400–700 | Meta, banners |
| `caption` | 12 / 16 | 500–700 | Chart labels, footnotes |
| `overline` | 11 / 14, caps, +0.08em | 700 | Card eyebrows ("A RACE · 70.3 DA NANG") |

### 3.6 Spacing, radius, elevation, motion
- **Spacing**: 4 px base (`--space-1…12` = 4…48). Screen gutter 16, card padding 16 (14 dense), section gap 24, list gap 8.
- **Radius**: `xs 6` chips · `sm 10` inputs · `md 14` session cards · `lg 20` hero cards · `xl 28` sheet tops · `pill` buttons, badges, segmented control.
- **Elevation**: light uses `--elev-1` (cards), `--elev-2` (selected segment, popovers), `--elev-3` (sheets/modals). Dark drops shadows and uses lighter surfaces (`surface → surface-2 → surface-3`).
- **Motion**: 120 / 200 / 320 ms with `--motion-ease` (`cubic-bezier(.2,0,0,1)`); sheets slide up, cards never bounce. All motion off with reduced-motion.

### 3.7 Icons
Original 24 px stroke icons, 2 px stroke, round caps (drawn in `design/mockups/src/build.py`; port them to `src/components/icons.tsx`). An MIT/ISC icon set (e.g. Lucide) is fine for generic glyphs; sport icons stay custom.

### 3.8 Implementation
```css
/* src/app/globals.css */
@import "tailwindcss";
@import "../../design/tokens.css";          /* raw tokens, light + dark */
@import "../../design/tailwind-theme.css";  /* @theme inline mapping + dark variant */
```
- Theme switch: set `<html data-theme="light|dark">` from the athlete preference; omit the attribute for `system` (tokens.css follows `prefers-color-scheme`). Set it server-side or in an inline head script to avoid a flash.
- Utilities: `bg-surface text-muted text-h1 rounded-md shadow-1 font-numeric min-h-tap bg-swim-soft text-run-ink`. Tailwind's default palette is removed (`--color-*: initial`), so stray `bg-blue-500` classes don't compile.
- Raw token names differ from Tailwind namespaces (`--fs-h1`, `--r-md`, `--elev-2`) so no variable references itself. Verified with Tailwind v4.3 CLI on 10 Nov 2026.

---

## 4. Component library (`src/components/ui/`)
Each component is presentational: props in, no data fetching, no training maths. Each gets a story on the `/dev/components` gallery page (M14) in light and dark. The first-time-user components (PrimaryActionBar … SafetyPrompt) are built in the milestone that first needs them (M16, M17, M18, M19, M23; see §5.9) and added to the same gallery.

| Component | Anatomy & behaviour | Key props | A11y |
|---|---|---|---|
| **SessionCard** | 4 px sport stripe · sport tile (icon) · title · meta line (time · duration · note) · one target row (ZoneChip or SkillChip + mini IntensityBars) · chevron. States: planned, done (tick + muted), partial, missed (strike-through meta, "Reschedule" action), moved (small "moved from Wed" caption), locked (skill gate, lock icon). Brick uses the split stripe/tile. | `session`, `variant: 'full'|'compact'`, `status` | Whole card is one link; status in text, not only colour |
| **DayStack** | Groups 0–N SessionCards (compact) for one day with date column; rest day shows moon + "Rest day". Double days show both, AM first. | `date`, `sessions[]`, `isToday` | Date read as full date |
| **WeekStrip** | 7 day cells: weekday initial, date (numeric font), up to 3 sport dots (rest = ring). Today = primary fill. Tap selects a day. | `days[]`, `selected` | Each cell `aria-label="Tue 10 Nov, swim and run"` |
| **WeekHeader** | Prev/next, "Week 1 · 9–15 Nov", phase + weeks to race, stacked **sport-hours bar** + legend + total, planned vs done when logs exist. | `week`, `summary` | Bar has text legend |
| **IntensityBars** | Step-proportional bars, height = zone (Z1 10 px … Z5 42 px), colour = zone; optional 4 px sport baseline (brick); dashed divider for transitions; dashed outline bar for skill steps. Mini variant (22 px) in cards. | `steps[]`, `size`, `showSport` | Hidden from AT; step list carries the info |
| **StepList** | Ordered steps: zone rail · name · duration (numeric) · ZoneChip with target (pace/power/CSS±/RPE) · one-line cue. Repeats show "3 ×" group. Transition step is a neutral inset row. | `steps[]`, `units` | `<ol>` with full text |
| **ZoneChip** | Dot + "Z2 · 5:14–5:55 /km". In skill mode becomes **SkillChip** (target icon + "Skill · S0"). "Test needed" variant is neutral grey with clock icon. | `zone`, `target`, `mode` | Text always present |
| **RaceCountdown** | Overline (race), display number "180" + "days to go · Sun 9 May", flag tile, phase bar with labels, row of TierBadges. Race week switches to hours and a checklist link. | `race`, `today`, `phases`, `tiers` | Live region off; static text |
| **TierBadge** | Pill: icon + "Sub-6:30" + optional reason. States: **on track** (success), **at risk** (warning), **off track** (danger), **needs data** (neutral clock). | `tier`, `state`, `reason?` | State word in label for screen readers |
| **WarningBanner** | Icon + bold headline + one sentence + **fix link**. Variants: info, warn, danger, heat. Maps 1:1 to `PlanWarning.code` (PLAN.md §8.9). Dismiss only hides for the current week. | `warning`, `onFix` | `role="status"`; never colour-only |
| **BRaceMarker** | Diamond in `--strength` on timelines/charts; in lists a flag row "B · Olympic tri · 14 Mar" with mini-taper (2–3 days before) and recovery days shaded. C races use a hollow diamond. | `race`, `priority` | Text label next to marker |
| **LoadRing** | Ring per week: planned hours (track) vs done (sport-segmented arc), centre "5:40 h". Small badge flags a threshold "black hole" week (PLAN.md §8.3). Readiness inputs are *later* (PLAN.md §6.3), so the ring shows load only. | `planned`, `done`, `bySport` | Values repeated as text |
| **CheckpointTrack** | Segmented bar per skill track (S0–S6, B0–B7), done segments in sport colour, next checkpoint with target date and "how to pass". Locks downstream sessions (e.g. no open water before S4). | `checkpoints[]` | List fallback with dates |
| **PhaseTimeline** | Horizontal segments sized by weeks (Prep, Base, Build, Peak, Taper), "you are here" fill, A-race flag at the end, B/C diamonds above. Tap a phase → that phase's weeks. | `phases[]`, `races[]`, `today` | Each segment a button with dates |
| **TrendChart** | Predicted finish over time: line + range band, dashed tier lines labelled at the right, B-race diamonds, "now" rule. Y axis in h:mm. | `points[]`, `tiers[]`, `events[]` | Table toggle below chart |
| **FuelCard / HeatCard** | Icon + headline ("Fuel 60 g/h", "Heat rehearsal") + one line; opens the fuel planner or heat calculator. | `plan`, `note` | — |
| **TabBar** | 5 tabs: **Today, Plan, Progress, Races, Settings**. Active tab = primary icon in a soft pill + label. 84 px incl. home-indicator area. | `active` | `nav` landmark, labels always visible |
| **PrimaryActionBar** | Sticky bottom bar with exactly **one** primary button, optional secondary. Today states: **Start** (before the session), **Log it** (after its planned time or once started), **Rest day** (no sessions; opens the rest explainer). | `action`, `secondary?` | One primary per screen (enforced in the gallery test) |
| **PlainLabel / TermLink** | Jargon + plain label pair: "Z2 · Easy, can chat", "CSS · your steady swim pace". The jargon part is a TermLink (dotted underline + ⓘ) that opens the GlossarySheet. | `term`, `plain?` | Link text names the term; 44 px hit area |
| **GlossarySheet** | Bottom sheet: term, one-sentence plain definition, "why it matters for you", example from the athlete's own numbers when known, "Read more" source link. Searchable list from Settings. | `termId` | Focus trapped; Esc/back closes |
| **AnswerChoice** | Big option rows for fitness questions: plain answers ("Can't swim 100 m yet", "Never ridden", "I don't know") above an optional "I know my time" row that reveals the numeric input. Picking a plain answer shows a SkillChip preview ("We'll start you on swim skills"). | `options[]`, `onNumeric` | Radio group semantics |
| **ProfileCompletionCard** | Today card after quick start: ring "3 of 7 done", next missing item with what it improves ("Add your training times → sessions fit your days"), Continue link; disappears when complete; snooze for a week. | `sections[]` | Not dismissable by swipe only |
| **SampleWeekPreview** | Week 1 as DayStacks (compact) + total hours, then a 3-way control **Too much · Looks right · Too little**; each tap regenerates with ±1 volume step and shows "−35 min" / "+30 min". Caps at availability. | `week`, `volumeStep` | Live region announces new total |
| **RpeSlider** | 1–10 slider with 5 face icons at 1–2, 3–4, 5–6, 7–8, 9–10 and a word under the thumb ("Easy, could chat"). Large thumb (44 px), tap anywhere to set. | `value` | Native range input; value text exposed |
| **OneTapLog** | Session card footer: **Done as planned** (primary) + "Something was different" link that expands the LogSheet fields. Shows the logged state inline with an UndoToast. | `session` | — |
| **ChangeNote** | Small inset note on a changed session: icon + "Why this changed: moved to Thu because Wed is now a rest day." Links to the change log. Grouped summary at the top of the week when > 2 changes. | `change` | Text, not icon-only |
| **UndoToast** | Bottom toast above the tab bar: "Session moved to Thu · **Undo**", 8 s (`project default, tune`), pauses on focus/hover; every action also lands in Settings → History. | `label`, `onUndo` | `role="status"`; Undo reachable by keyboard |
| **EaseBackCard** | After missed time: "Welcome back. Ease me back in?" with the lighter week preview, **Ease me back in** (primary) / "Pick up where I left off". | `missedDays`, `preview` | — |
| **CelebrationCard** | One-time card or sheet for a checkpoint or first ("First 25 m continuous! S1 done"), sport-coloured badge, what's next, Share/Close. Confetti-free by default, subtle scale-in respecting reduced motion. No streaks. | `milestone` | Focus moves to it; closable |
| **CoachTip / TourStep** | Tour: 3 full-screen steps (Today · Your week · Logging) with illustration area, dots, Skip. Tip: one-time anchored callout per screen ("Tap a zone to see what it means"), dismiss = seen. | `tipId`, `anchor` | Never blocks the primary action; Esc closes |
| **EmptyState** | Icon + what will appear here + how to unlock it + optional action ("Log 3 sessions to see your first trend" · progress 1/3). | `title`, `unlock`, `progress?` | — |
| **SafetyPrompt** | Pre-start sheet with a checklist the athlete ticks before **Start** is enabled (first open-water swim, first clip-in ride, first road ride, first hot session). Shown once per kind, available again via ⓘ on the session. | `kind`, `items[]` | Checkboxes; Start disabled state explained in text |
| **Buttons, SegmentedControl, Stepper, Toggle, Sheet** | Primary pill 52 px, secondary on `surface-2`, ghost link; segmented Week/Month/Phases; minute stepper with − / + (44 px); sheet with `xl` top radius for Move/Log. | — | Focus ring `--focus-ring` 2 px + 2 px offset |

---

## 5. Screens (mobile-first; tablet/desktop = same column centred, max-width 480 px, Plan shows 2 weeks side by side ≥ 1024 px)

### 5.1 Onboarding
**Quick start (default, 3 steps + preview, target < ~2 min):** (1) A race (search or custom; date fills cut-offs for known races), (2) goal tier (*just finish inside the cut-offs* / a time / stretch), (3) training days (tap the weekdays; per-day time uses defaults), then the **SampleWeekPreview** with *Too much / Looks right / Too little* and **Build my plan**. Fitness questions are skipped: every sport without data starts in skill mode, and Today shows the **ProfileCompletionCard** to fill in the rest (full steps below) whenever the athlete likes. A "Set up everything now" link takes the full path.

**Full setup (~8 steps, progress bar + "n of 8", back on every step, skip where optional):**
1. **Goal race**: pick A race (search or custom) → date, distances, cut-offs prefilled for known races (Da Nang seed).
2. **Goal tiers**: cut-offs / sub-X / stretch, with plain-language realism note.
3. **Your sports today**: per sport, **AnswerChoice** with plain answers ("Can't swim 100 m yet", "Never ridden a bike", "I run, no recent race", "I don't know") → any of these sets skill mode and picks the first checkpoint.
4. **Current times (optional, every question has "I don't know")**: run 5k/10k/HM/M, swim CSS/400/1000, bike FTP/20-min/timed ride. Each shows the estimate it produces ("HM 1:39:00 → threshold ≈ 4:35/km, medium confidence").
5. **Availability** *(mockup 01)*: weekday toggle + minute stepper + "2×" double-session chip, long-session day chips, live **feasibility banner** before continuing.
6. **Strength (optional)**: toggle, 0–3/week, equipment.
7. **Equipment**: bike, fit, trainer, clipless, power meter, HR strap, pool, open water. No bike → explains indoor bridge.
8. **Summary + sample week**: everything on one card with Edit links, the first warnings, then the SampleWeekPreview and "Build my plan".
*Improves on Runna*: progress indicator on every step (the ScreensDesign critique), feasibility shown **before** the plan, skill-mode choice per sport.

### 5.2 Today *(mockups 02 light, 02b dark)*
Header (date overline, greeting, avatar → Settings) → **WarningBanner(s)** → **RaceCountdown** (phase bar + tier badges) → **WeekStrip** → "Today · 2 sessions · 1 h 25 min" → **DayStack** of SessionCards (AM swim lesson in skill mode, PM easy run with Z2 pace from the seed threshold) → Heat/Fuel card. Rest day: a calm card with "Why rest matters" and tomorrow's preview. **PrimaryActionBar**: Start / Log it / Rest day (one primary only). After quick start, the **ProfileCompletionCard** sits under the countdown; in week 1 the tour and one CoachTip per screen appear once; after missed time the **EaseBackCard** replaces the warnings slot. Race week: countdown becomes hours + race-week checklist.

### 5.3 Plan *(mockup 03: Week)*
- **Segmented control**: Week · Month · Phases. "Move sessions" opens move mode (tap a session → tap a valid day; invalid days greyed with a reason). Drag is an enhancement on top.
- **Week**: PhaseTimeline (compact) → WeekHeader (sport-hours bar) → DayStack per day with sport-tinted compact rows, chips for skill/zone/indoor/key → checkpoint row when one is due → warnings for that week at the top.
- **Month**: 7-column calendar, each day shows stacked sport dots + total minutes; B/C race diamonds; recovery weeks shaded.
- **Phases**: vertical list of phases with dates, focus line, weekly hours range, key checkpoints and B races; tap → week.

### 5.4 Session detail *(mockup 04: brick)*
Tinted hero (sport or brick gradient) → back / overflow → sport tile + date·phase·weeks-out overline + title → chips (Key, total, per-sport split) → **Why** line → warnings (e.g. "FTP test needed": ride by RPE, watts appear after a test) → **IntensityBars** with sport baseline + T2 divider → **StepList** (bike steps, T2 practice row, run-off-the-bike at goal race pace 5:27/km from the seed split, cool-down) → Fuel + Heat cards → sticky **Move** / **Log session**. Open-water swims show the safety checklist (buddy, bright cap, tow float, conditions) above the steps and can't be logged as "solo"; the first one (and the first clip-in or road ride) opens a **SafetyPrompt** before Start. Changed sessions show a **ChangeNote**. Zone chips read "Z2 · Easy, can chat" with a TermLink.

### 5.5 Log workout (sheet from Session detail or "+")
Default is **OneTapLog**: *Done as planned* logs planned values in one tap (UndoToast). *Something was different* opens the sheet below; RPE uses the **RpeSlider** with faces.
Done / partial / skipped segmented → duration, distance, avg pace/power/HR (fields depend on sport and equipment) → RPE 1–10 slider with words → "heat exposure" toggle → notes. After save: a short result card ("Target hit: 38/40 min in Z2") and any re-plan diff ("2 future sessions updated"). Missed session → options only to valid slots this week, or skip; never "add to tomorrow".

### 5.6 Progress *(mockup 05, illustrative future data)*
Predicted finish hero (display number + range + TierBadges) → **TrendChart** (tier lines, range band, B-race diamonds) → per-leg card (prediction vs target, state badge, heat-adjusted note, T1/T2 budgets, weakest leg named) → **CheckpointTrack** for swim and bike → weekly load (LoadRing + 6-week bars) → estimates list with method + confidence. Before there's data, each block is an **EmptyState** ("Log 3 sessions to see your first trend", "Do a CSS test to get swim zones"). Checkpoint passes trigger a **CelebrationCard** once. Estimates read e.g. "CSS · 400+200 test · high".

### 5.7 Races
A race card (countdown, cut-offs with predicted margins, "minimum bike speed to make 5:30") → B/C races list (BRaceMarker rows, mini-taper and recovery dates) → "Add race" (type, date, distances) → after a B race: "Log result" with per-leg times, conditions, RPE → benchmark card (e.g. "A-race prediction 6:31 → 6:24"). Race-day page: splits, heat-adjusted run, fuel plan per aid station, checklist and packing list.

### 5.8 Settings & availability
Grouped list: Profile & units (km/mi, °C/°F, week start, theme light/dark/system) · Availability (same grid as onboarding) · Strength · Equipment · Performance inputs (history + add) · Sick/travel/injury mode · Calendar export (.ics) · Data export/import · About & sources. Each change that re-plans shows a confirm sheet with the diff and the new warnings. Also: **History** (every plan change with its "why" and Undo), **Glossary**, **Replay tour**.

---

### 5.9 First-time-user ease of use (PLAN.md §6.4; built in M16, M17, M18, M19, M23)
| Feature | Where it shows | Components | Copy / rule notes |
|---|---|---|---|
| Quick start | Onboarding §5.1, Today | SampleWeekPreview, ProfileCompletionCard | 3 steps; defaults for the rest; "Set up everything now" link |
| "I don't know" answers | Onboarding steps 3–4, Settings → Performance inputs | AnswerChoice, SkillChip | Plain answer → skill mode + first checkpoint |
| Plain language + glossary | Every zone chip, target, metric label | PlainLabel, TermLink, GlossarySheet | Zone labels (project copy, tune): Z1 "Very easy, recovery" · Z2 "Easy, can chat" · Z3 "Steady, short sentences" · Z4 "Hard, a few words" · Z5 "Very hard, can't talk". Glossary: FTP, CSS, threshold, zone, RPE, brick, taper, T1/T2, cut-off, A/B/C race, skill mode, open water |
| First-week walkthrough | After the first plan; one tip per screen | TourStep, CoachTip | Tour: Today → Your week → Logging; Skip always visible; replay in Settings |
| One primary action | Every screen | PrimaryActionBar | Today: Start / Log it / Rest day. Session detail: Log session. Onboarding: Continue |
| One-tap logging | Session cards, Session detail | OneTapLog, RpeSlider | RPE words (project copy): 1–2 "Very easy" · 3–4 "Easy, could chat" · 5–6 "Steady" · 7–8 "Hard" · 9–10 "All out" |
| Why this changed | Changed sessions, week header, Settings → History | ChangeNote | From `changes[].reasonCode`; one sentence, plain words, e.g. "Shortened to 45 min: Friday's time limit is 45 min" |
| Forgiving defaults | Today after missed time; toast after any action | EaseBackCard, UndoToast | Never stack missed work; undo restores the exact previous state |
| Small wins | After a checkpoint or first | CelebrationCard | Firsts: swim lesson, 25 m continuous, bike bought, first outdoor ride, first brick, first full week, first B race. Shown once, no streak counters |
| Sample-week preview | End of onboarding (quick and full) | SampleWeekPreview | ±10% weekly minutes per tap (project default, tune), capped by availability |
| Teaching empty states | Progress, Races, Plan before generation, History | EmptyState | Say what appears and how to unlock it, with progress (1/3) |
| Beginner safety prompts | Before Start on the first session of each risky kind | SafetyPrompt | Open water: buddy, bright cap, tow float, conditions (USMS). Clip-in: practise on a trainer (USA Triathlon) or on grass first (project copy). Roads: low-traffic route, signals, no music (USA Triathlon). Heat: drink to plan (PLAN.md §9) |

Mockup note: the PNGs in §7 predate this section, so they don't show the PrimaryActionBar on Today, the ProfileCompletionCard, plain zone labels or OneTapLog. Follow this section, not the mockups, for those.

## 6. Where this improves on Runna for triathlon
| Area | Runna (as observed) | This app | Why |
|---|---|---|---|
| Multi-sport days | One workout per day row, colour by run type | **DayStack** with AM/PM sessions, colour by sport, zone shown separately | Triathletes often double up; sport identity matters more than run type |
| Brick view | Not observed | Split brick tile/stripe, IntensityBars with **sport baseline** and **T2 step**, run-off-the-bike at goal pace | Bricks are the race-specific session from Build onward (PLAN.md §8.5) |
| Skill mode | Not observed | SkillChip, dashed skill bars, CheckpointTrack, locked sessions until a checkpoint passes | A novice swimmer/cyclist needs skills before zones (PLAN.md §8.8) |
| Cut-off awareness | Estimated finish time range | Tier badges incl. **cut-offs**, per-leg margins, minimum bike speed, `CUTOFF_RISK` banners | Cut-offs can end the race for a beginner; the finish time can't |
| Heat notes | Not observed | HeatCard, heat-adjusted run pace, heat-exposure tagging | Da Nang in May is hot and humid (PLAN.md §2, §9) |
| Honest data | Not observed | "Needs data", "test needed", "estimated", confidence labels | Novices start without FTP/CSS; the UI must not invent numbers |
| Feasibility | Not observed | Warnings with fix hints from availability to cut-offs, shown during onboarding too | The generator never fails silently (PLAN.md §8.9) |
| First-time users | Long onboarding quiz (ScreensDesign critique) | 3-step quick start + sample week, plain answers instead of numbers, glossary, undo, Ease me back in, safety prompts | A complete beginner shouldn't need to know FTP or CSS to start |
| Accessibility | Dark-only screenshots | Light + dark, measured contrast, Move button as drag alternative | WCAG 2.2 AA |

---

## 7. Mockups
- PNGs (390 × 844 @2x): `design/mockups/01-onboarding-availability.png`, `02-today.png`, `02-today-dark.png`, `03-plan-week.png`, `04-session-detail-brick.png`, `05-progress.png`, and `overview.png`.
- Source: `design/mockups/src/build.py` generates the HTML from `design/tokens.css` + `seed/athlete-profile.json` and renders with headless Chrome: `python3 design/mockups/src/build.py`.
- Data honesty: race facts, countdown, threshold pace (275 s/km → Z2 5:14–5:55/km via Friel 114–129%) and the 5:27/km goal run pace come from the seed. The week's session mix, the onboarding availability values and the Progress screen (predictions, B race, checkpoint counts) are **illustrative**; Progress is tagged on-screen.
- Mockups are a visual target, not pixel specs. Components and tokens are the contract.

---

## 8. Sources
[as]: https://apps.apple.com/us/app/runna-running-plans-coach/id1594204443
[web]: https://www.runna.com/
[rw]: https://www.runnersworld.com/training/a69110486/runna-app-review-i-tried-it/
[tg]: https://www.tomsguide.com/reviews/runna-app
[sd]: https://screensdesign.com/showcase/runna-running-training-plans
[tw-theme]: https://tailwindcss.com/docs/theme
[tw-dark]: https://tailwindcss.com/docs/dark-mode
[wcag-143]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
[wcag-1411]: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
[wcag-258]: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
[wcag-257]: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html

- Runna on the Apple App Store: description and 6 screenshots (Strava, Inc.)
- Runna website (runna.com)
- Runner's World, "I Tried Strava's New Run-Coaching App Called Runna For Six Weeks"
- Tom's Guide, "Runna app review"
- ScreensDesign, "Runna: Running Plans & Coach UI Breakdown"
- Tailwind CSS docs: Theme variables; Dark mode
- W3C WCAG 2.2 Understanding: 1.4.3 Contrast (Minimum), 1.4.11 Non-text Contrast, 2.5.8 Target Size (Minimum), 2.5.7 Dragging Movements
- Fonts: Plus Jakarta Sans and Barlow Semi Condensed (SIL Open Font License, Google Fonts)
