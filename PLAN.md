# PLAN: Adjustable IRONMAN 70.3 / triathlon training-plan app
### Seed example: Wisnu, IRONMAN 70.3 Da Nang (9 May 2027), stretch goal sub-6:00

> Feed this file to Cursor with `@PLAN.md`. Build **one milestone per chat** (see §10 and §11). For UI milestones also add `@DESIGN.md` and `@design/tokens.css`.
> The app is **generic**: every athlete setting is adjustable (§3). Wisnu's Da Nang profile (§2, §4, §5) is only the seed example and the main test fixture.
> `TODO(athlete)` = a value the athlete enters. `project default, tune` = a number with no source behind it, kept in constants so it can be changed.
> Not medical advice. Get a check-up before a big training block, especially for racing in the heat.

---

## 1. Product goal

A single-user web app (one athlete per install for now) that:
1. Takes **any** A race, goal tiers, availability, strength preference, equipment and **whatever current performances the athlete knows** (race times, test results, or nothing).
2. Derives zones and paces from the best available estimate, or uses **skill mode** for a sport with no data yet.
3. Builds a periodised plan counted back from the A race (Prep → Base → Build → Peak → Taper), with mini-tapers around **B/C races**. It respects the athlete's availability and **warns** when that availability can't support the goal or the cut-offs.
4. Turns goal tiers into per-leg pacing, adjusts it for heat, and plans fuelling.
5. Lets the athlete log workouts, new times and B-race results, then re-tailors the remaining plan and updates the predicted A-race time and tier status.

**Success:** the athlete opens the app each morning and knows exactly what to do today, at what intensity, and whether they're on track for each goal tier.

---

## 2. Race facts: seed example (IRONMAN 70.3 Da Nang, sourced)

| Fact | Value | Source |
|---|---|---|
| Race | IRONMAN 70.3 Da Nang, Vietnam | [ironman.com/races/im703-danang][im-race] |
| Date | **Sunday 9 May 2027** | [ironman.com race page][im-race] |
| Distances | 1.9 km swim / 90 km bike / 21.1 km run | [ironman.com distances][im-dist] |
| Start | 05:45 local, rolling swim start (times from the 2026 guide; confirm in the 2027 guide) | [2026 Athlete Guide][aig] |
| Swim | 1 lap, clockwise triangle, sea swim off East Sea Park (My Khe area). Expected water temp in 2026 was 29 °C. | [2026 Athlete Guide][aig] |
| Wetsuit (age group) | Legal up to 24.5 °C. From 24.6 to 28.8 °C, allowed only in a separate non-competitive wave if one is offered (no AG awards or slots). Banned above 28.8 °C. The official call is made on race morning. **Plan to swim without a wetsuit.** | [IRONMAN 2026 Competition Rules §4.02][rules], [2026 Athlete Guide][aig] |
| Bike | 90 km, one loop, "flat". Start elevation 5 m, max 50 m, total gain about 278 m. | [Course page][course], [2026 bike map PDF][bikemap] |
| Run | 21.1 km, flat, 2 loops of an out-and-back on the beachfront. Aid every 1.2–1.4 km with water, Aquarius electrolyte, Lecka gels, cola, banana, watermelon, ice bags and splash zones. | [2026 Athlete Guide][aig] |
| Bike aid | km 19, 37, 46, 64, 79.5: water, Aquarius electrolyte, Lecka gels (one flavour has caffeine), banana, sunscreen | [2026 Athlete Guide][aig] |
| Transition | T1 and T2 are in the same place, at East Sea Park / Bien Dong Park | [Course page][course] |
| Air temp | Course page: high 34 °C, low 26 °C. May at Da Nang airport: daily highs about 32–34 °C, and about 99% of May days are "muggy" by dew point. | [Course page][course], [WeatherSpark May][wx] |
| Cut-offs (per athlete) | Swim 1:10. Swim + T1 + bike 5:30. Whole race 8:30. There are also intermediate cut-offs. | [2026 Athlete Guide][aig] |
| Swim start zones | <33 min, 34–38, 39–44, >44 | [2026 Athlete Guide][aig] |

> The app stores these in `seed/athlete-profile.json` as `race`. Aid-station positions and the start time come from the **2026** guide. Re-check them when the 2027 guide is published.

---

## 3. Athlete settings (generic, all adjustable)

Every setting can be edited at any time. A change triggers a re-plan of **future** weeks only; past and logged sessions are never rewritten. Each re-plan returns `{ plan, warnings[] }` (§8.9).

### 3.1 A race & goal tiers
- A race: name, date, type (`70.3 | full | olympic | sprint | custom`), leg distances, start time, cut-offs (any number, each with a leg range and a limit), aid-station km lists, climate note.
- Goal tiers: any number, e.g. `CUTOFFS`, `SUB_630`, `SUB_600`, each with a target finish and a buffer.

### 3.2 Training availability
| Setting | Type | Notes |
|---|---|---|
| `sessionsPerWeek.total` | int | Upper bound across all sports, strength included |
| `sessionsPerWeek.swim / bike / run` | int each (min–max allowed) | e.g. swim 2–4. The generator never exceeds a max, and warns when it can't reach a min |
| `availableDays` | per weekday: `{ available: bool, maxMinutes: int, doubleSessionOk: bool }` | `maxMinutes` is a hard cap per day |
| `restDays` | weekdays | Always empty |
| `longSessionPrefs` | `{ longRideDay, longRunDay, brickDay }` | Preferences; the generator falls back to the next available day and logs why |
| `strength` | see 3.3 | |

### 3.3 Strength (optional)
`{ enabled: bool, sessionsPerWeek: 0–3, preferredDays?: weekday[], equipment: 'gym' | 'home' | 'bodyweight' }`. Rules are in §8.10.

### 3.4 Current performance inputs (any, all optional)
| Sport | Accepted inputs |
|---|---|
| Run | Race or time trial: 1500 m, mile, 3 km, 5 km, 10 km, 15 km, HM, M (Daniels VDOT range). Friel 30-min test (average pace). Optional LTHR |
| Swim | CSS test (400 + 200). 400 m TT only. 1000 m TT (Friel T-time). 1500 m TT. 100 m alone (accepted but low confidence) |
| Bike | FTP entered directly (e.g. from a ramp test). 20-min test average power. 30-min test average power. Timed ride: distance + time (+ terrain note) with no power meter. Optional LTHR |
Each input stores its date, conditions note and source (`FIELD_TEST | RACE | B_RACE | MANUAL`). Derivation and best-estimate rules are in §8.11. A sport with **no input stays in skill mode** (§8.8).

### 3.5 B and C races
Any number, each with: date, priority `B | C`, type (`sprint_tri | olympic_tri | 70.3 | run | swim | gran_fondo | duathlon | other`), leg distances, notes. Rules are in §8.12.

### 3.6 Equipment & preferences
- Equipment: `hasBike`, `bikeFitDone`, `hasIndoorTrainer`, `hasClipless`, `hasPowerMeter`, `hasHrMonitor`, `poolAccess`, `openWaterAccess`.
- Preferences: units (`km | mi`, `°C | °F`), week start day, theme (`system | light | dark`), athlete home location (for heat notes, later).

## 4. Seed example athlete: Wisnu (as of 10 Nov 2026)

**Starting point:** a strong runner (1:39:00 half marathon, 3:49:00 marathon), **has never cycled and has no bike yet**, and **barely swims**. The plan and the app are built around that.

| Field | Default | Notes |
|---|---|---|
| `race.name` / `race.date` | IRONMAN 70.3 Da Nang / 2027-05-09 | from §2 |
| `goal.finishTime` | stretch **< 6:00:00** (see §5 for the goal tiers) | Wisnu's goal |
| `equipment.hasBike` | **false** | Until it's true, bike sessions are indoor spin/stationary-bike sessions (§8.8) |
| `equipment.bikeFitDone` / `hasIndoorTrainer` / `hasClipless` | false / false / false | These gate the bike skill milestones |
| `disciplineStatus.swim` | **`skill`** | Skill checkpoints instead of zones until a CSS test is possible (§8.8) |
| `disciplineStatus.bike` | **`skill`** | Skill checkpoints instead of zones until an FTP test is possible |
| `disciplineStatus.run` | `zones` | Proven runner |
| `raceResults` | HM 1:39:00, M 3:49:00 | Dates and conditions: `TODO(Wisnu)` |
| `fitness.thresholdRunPaceSecPerKm` | **275 (≈4:35/km), *estimated*** | Daniels VDOT from the HM. Confirm with Friel's 30-min test in Prep (§8.1) |
| `fitness.ftpWatts` | `null` (novice) | First FTP test once bike skills checkpoint B5 is done |
| `fitness.cssSecPer100m` | `null` (novice) | First CSS test once swim checkpoint S3 is done (400 m continuous) |
| `fitness.lthrBike` / `fitness.lthrRun` | `TODO(Wisnu)` (optional) | |
| `fitness.bodyMassKg` / `sweatRateLPerH` | `TODO(Wisnu)` | for fluid planning (§9) |
| `schedule.weeklyHoursAvailable` / `restDays` / `longDay` | `TODO(Wisnu)` | |
| `schedule.recoveryBlockWeeks` | `3` | Friel suggests 3-week blocks for novices ([Friel, Base 2 & 3][friel-base]) |

### 4.1 Run threshold estimated from race results
Method: **Jack Daniels' VDOT tables** ([VDOT tables PDF][vdot]).
- **HM 1:39:00** falls between VDOT 45 (HM 1:40:20) and VDOT 46 (HM 1:38:27), so **VDOT ≈ 45.7**. Daniels' **T (threshold) pace** is 4:38/km at VDOT 45 and 4:33/km at VDOT 46, which gives **≈ 4:35/km (275 s/km)**.
- **M 3:49:00** gives roughly VDOT 40 (M 3:49:45), with a T pace of 5:06/km.
- The app uses the **HM-derived value**. A half marathon is much closer to threshold duration than a marathon, and marathon results depend heavily on endurance and fuelling. That is my reasoning, not a quote from Daniels.
- The gap between the two VDOTs (≈46 vs 40) suggests long-duration endurance is the limiter, which matters for a ~6 h race.
- This is an **estimate**. Daniels' T pace and Friel's 30-min-TT threshold pace are related but not identical. Replace the estimate with a real Friel 30-min test in Prep.

## 5. Seed example goal & split (honest version)

### 5.1 Goal tiers
IRONMAN says first-timers *often finish in 6:30–8:00* ([ironman.com distances][im-dist]). Wisnu's run is well above beginner level, but he is starting from zero on the bike and near zero in the water, with ~26 weeks to go. So:
- **A goal: finish safely inside every cut-off.** Swim ≤ 1:10. Swim + T1 + bike ≤ 5:30. Total ≤ 8:30.
- **B goal: sub-6:30.**
- **Stretch: sub-6:00.**

The app shows all three and recomputes which one is on track after every test.

### 5.2 Starting split for the stretch goal (recompute after tests)
| Leg | Target | Implied pace | Reasoning |
|---|---|---|---|
| Swim 1.9 km | **0:50:00** | ~2:38 /100 m | Conservative. For a near-non-swimmer, the real goal is swimming 1.9 km continuously in the sea, with no wetsuit likely (§2). 50 min leaves 20 min to the 1:10 cut-off. Seed in the ">44 min" start zone. |
| T1 | **0:07:00** | — | Beach run plus a first-timer's transition. A budget assumption. |
| Bike 90 km | **3:00:00** | 30.0 km/h | The make-or-break leg. Flat course with ~278 m gain, but it's a big ask for someone who has never ridden (see 5.3). |
| T2 | **0:04:00** | — | A budget assumption. |
| Run 21.1 km | **1:55:00** | ~5:27 /km | Faster than the old 2:10 because the run is the proven leg. 5:27/km is about his **marathon race pace** (3:49:00 is 5:26/km) and close to his Daniels *Easy* pace at VDOT 45–46 (5:28–5:34/km, [VDOT tables][vdot]). That's about 16% slower than his open HM pace (4:42/km). The margin covers late-morning heat (Ely et al. 2007 shows bigger slowdowns for slower runners as WBGT rises; §9) and fatigue after his first-ever 3 h ride. I found no source for an "off-the-bike" penalty, so that part is a judgement call. |
| **Total** | **5:56:00** | | 4:00 buffer under 6:00:00 |

### 5.3 Is sub-6 realistic? Plain answer
- **Possible, but a genuine stretch, and it rests almost entirely on the bike.** The run (≈1:55) is very likely achievable for a 1:39 half marathoner. The swim (~50 min) is plausible if lessons start now and he reaches continuous swimming by mid-Jan.
- Averaging **30 km/h for 90 km in heat, ~6 months after first getting on a bike**, is the big unknown. I couldn't find data to put odds on it, so I won't.
- Every extra 10 min on the bike (3:10 ≈ 28.4 km/h) or swim pushes the finish past 6:00 unless the run is faster.
- **Decision checkpoint, mid-February 2027 (end of Base):** by then he should have a first FTP test and a 1.9 km continuous pool swim. The app predicts bike speed from FTP (as a user-tuned estimate, since no sourced power-to-speed model is in this plan), recalculates the splits, and says which tier is on track.
- **Cut-off safety is not at risk at sub-6 pace:** swim + T1 + bike would be about 3:57, against a 5:30 limit. Even so, the minimum bike average to make the 5:30 cut-off after a 57-min swim + T1 is **≈19.8 km/h**. The app shows this "must-not-go-below" number.

## 6. Features

### 6.1 Core (milestones M0–M20)
1. **Athlete settings** (§3): race and tiers, availability, strength, equipment, preferences, with live re-plan.
2. **Performance inputs and estimators** (§8.11): enter any times, get zones and paces from the best estimate. Each estimate shows its method and confidence, and is re-derived whenever a new time is entered.
3. **Zones** (§8.1): power, pace, CSS ± seconds, HR. "Test needed" when nothing is known.
4. **Skill tracks** (§8.8) for a sport with no data or a novice athlete; equipment gating (no bike gives indoor bridge sessions).
5. **Periodised plan** (§8.2–8.4) with B/C race mini-tapers and recoveries (§8.12).
6. **Availability-aware generator** (§8.6, §8.9) with strength placement (§8.10) and **feasibility warnings**.
7. **Race pacing**: tiers to splits, cut-off checks, and the minimum speed needed to make each cut-off.
8. **Heat-adjusted pacing** and the **fuel & fluid planner** (§9).
9. **Log and adapt**: workouts, missed sessions (§6.2), new times, B-race results to re-estimate, predicted A-race time, and tier status.
10. **Progress**: predicted A-race time trend, weekly load summary, checkpoints.

### 6.2 Quality of life: must-have (M16–M25)
| Feature | Behaviour |
|---|---|
| Missed-session handling | Options: *skip*, or *move within the same week* if a valid slot exists. **Never stack missed work on top of the next day** (no guilt-cramming). Key sessions take priority for the free slot. |
| Swap / drag-and-drop with auto-rebalance | Move or swap sessions in the week view. The generator re-validates against availability, rest days, strength spacing and the hard-session limit, then either rebalances the rest of the week or rejects the move with a reason. |
| Sick / travel / injury mode | Date range plus type. *Sick*: no training, then an easy re-entry (project default, tune). *Travel*: availability override (e.g. run only, 30 min/day). *Injury*: pick the affected sports, which are removed and the others kept. Re-plans afterwards and shows the effect on tier status. |
| Weekly load summary | Planned vs done hours and sessions per sport, the hard-session count, and the intensity mix (flags a threshold "black hole", §8.3). |
| Predicted A-race time trend | Chart of the predicted finish over time, with tier lines. Updates after each new estimate or B race. |
| Race-week checklist & packing list | Generated from race type and conditions: wetsuit rule note, heat kit, fuel plan quantities, transition bags. Editable and tickable. |
| Fuelling plan | Per hour and per aid station (§9). Also gives practice targets for long sessions. |
| Calendar export (.ics) | Download the next N weeks as an iCalendar file (one event per session, with targets in the description). |
| Data export / backup / import | One JSON file with everything, plus CSV of logs. Import validates and runs a dry-run diff first. |
| Units & display | km/mi, °C/°F, pace formats. Dark mode. Mobile-friendly responsive layout. |

### 6.3 Quality of life: later (backlog, not in the milestone list)
- Strava / Garmin import (OAuth + activity sync, auto-match to planned sessions).
- Live weather / heat note for the athlete's location (weather API) and a race-week forecast with WBGT.
- Installable PWA with offline mode and push reminders.
- Workout export to devices/apps (structured workout files).
- Readiness inputs (sleep, soreness, HRV) feeding the adaptation rules.
- Multi-athlete / coach sharing.

### 6.4 First-time-user ease of use (M16, M17, M18, M19, M23)
For someone new to triathlon (and to training apps). UI details are in DESIGN.md §5.9. Copy, thresholds and step sizes below are `project default, tune`.
| # | Feature | Behaviour | Milestone |
|---|---|---|---|
| 1 | Quick-start onboarding | 3 steps only: A race, goal tier, training days. First plan in under ~2 min. Everything else uses defaults (per-day `maxMinutes` defaults, strength off, every sport without data in skill mode) and is finished later from a **"Finish your profile"** card on Today that lists what's missing and what each item improves. | M17 |
| 2 | "I don't know" answers | Every fitness question offers plain options ("can't swim 100 m yet", "never ridden a bike", "I run, no recent race", "I don't know") next to the number field. Any non-numeric answer puts that sport in **skill mode** (§8.8) and the first checkpoint is picked from the answer (e.g. "never ridden" → B0). | M17 |
| 3 | Plain language + glossary | Every jargon term shows a plain label beside it (Z2 → "Easy, can chat"; CSS → "your steady swim pace"). Terms (FTP, CSS, brick, taper, zone, RPE, T1/T2, cut-off, B race…) are tappable and open a glossary sheet. Glossary text lives in `src/content/glossary.ts`, one entry per term with a source link where the definition comes from PLAN.md. | M17 |
| 4 | First-week walkthrough | A 3-screen tour after the first plan (Today, your week, logging) plus one-time contextual tips per screen, stored as "seen". Replayable from Settings. | M23 |
| 5 | One primary action per screen | Each screen has exactly one filled primary button. Today: **Start** (session not started), **Log it** (after its time), or **Rest day** (no sessions; opens the rest explainer). | M16 |
| 6 | One-tap logging | "Done as planned" logs planned duration/targets in one tap. "Something was different" opens the detail fields. RPE is a 1–10 slider with faces and words. | M16 |
| 7 | "Why this changed" | Any automatic plan change (adapt, missed session, mode, new test) shows a short note on the affected sessions and in a change log: what changed and why, in plain words, with a link to the rule. | M18 |
| 8 | Forgiving defaults | **Ease me back in**: after missed time, offer a lighter re-entry week instead of resuming (§8.7). **Undo** on every move, skip, edit and log (toast, plus history in Settings). | M23 |
| 9 | Small wins | One-time celebrations for skill checkpoints (S1…S6, B0…B7) and firsts (first swim lesson, first outdoor ride, first brick, first full week). Calm, dismissible, no streak pressure. | M23 |
| 10 | Sample-week preview | Last onboarding step shows week 1 as it will be generated, with **Too much / Looks right / Too little**. Each tap moves a volume scale one step (±10% of weekly minutes) and regenerates, within availability caps. | M17 |
| 11 | Teaching empty states | Empty screens say what will appear and how to unlock it ("Log 3 sessions to see your first trend", "Add a B race to benchmark your fitness"). | M19 (and every screen) |
| 12 | Beginner safety prompts | Shown in context before Start, once per kind and again on request: first open-water swim (buddy, bright cap, tow float, conditions; never solo, PLAN.md §8.8), first clip-in ride ("practise clipping in on a trainer or on grass first"; trainer practice is from USA Triathlon, the grass tip is project copy), first ride on roads (low-traffic route, signals, no music), first hot session (drink to plan, §9). Other prompts use the skill-track sources in §8.8. | M23 |

## 7. Stack (beginner-friendly, single user)

- **Next.js (App Router) + TypeScript (`strict`)**: UI and server in one project, with lots of examples. *Tell the agent to check the current Next.js docs for setup commands rather than rely on memory* (the course warns about knowledge cutoffs).
- **SQLite + Prisma**: a single file DB, no server to run, typed queries, easy reset and seed.
- **Vitest**: fast unit tests for the training logic. That logic is pure TypeScript, so it doesn't depend on Next.js.
- **ESLint + `tsc --noEmit`**: lint and type-check feedback that the agent can read.
- **Tailwind v4**: styling via the project tokens (`design/tokens.css` + `design/tailwind-theme.css`, see `DESIGN.md`). v4 is configured in CSS (`@theme`), not a JS config file.

Folder layout:
```
src/
  lib/training/        # PURE functions only: units, zones, estimators, skills, phases, races, availability,
                       #   strength, sessions, pacing, heat, fuel, adapt, ease, modes, ics, checklist
    constants.ts       # every number, each with a SOURCE comment
    *.ts / *.test.ts
  lib/db/              # Prisma client + repository functions
  lib/ui/              # tiny UI helpers (contrast check, class helpers); no training maths
  components/ui/       # presentational component library (DESIGN.md §4)
  content/             # glossary.ts, tips.ts, plain-language labels (copy only, no logic)
  app/                 # Next.js routes/pages (thin: call lib, render)
design/                # tokens.css, tailwind-theme.css, mockups/ (see DESIGN.md)
prisma/schema.prisma
seed/athlete-profile.json
```

---

## 8. Training logic rules (sourced)

Every number lives in `src/lib/training/constants.ts` with a `// SOURCE:` comment. A number with no source is tagged `// SOURCE: project default, tune` so it's obvious it's a guess.

### 8.1 Zones
- **Bike power (Coggan, % FTP):** Z1 ≤55, Z2 56–75, Z3 76–90, Z4 91–105, Z5 106–120, Z6 121–150, Z7 >150. [TrainingPeaks: Coggan levels][coggan]
- **Run pace (Friel, % of threshold *pace*; a higher % means slower):** Z1 slower than 129%, Z2 114–129%, Z3 106–113%, Z4 99–105%, Z5a 97–100%, Z5b 90–96%, Z5c faster than 90%. [Friel quick guide][friel-zones]
- **Run/bike HR (Friel, % LTHR):** Run Z1 <85, Z2 85–89, Z3 90–94, Z4 95–99, Z5a 100–102, Z5b 103–106, Z5c >106. Bike Z1 <81, Z2 81–89, Z3 90–93, Z4 94–99, Z5a 100–102, Z5b 103–106, Z5c >106. [Friel quick guide][friel-zones]
- **Swim:** CSS pace per 100 m = `(T400 − T200) / 2` in seconds ([TrainingPeaks threshold tests][tp-tests]). Express swim targets as **CSS ± seconds**, following Friel's "T-time + 5 s" convention ([Friel quick guide][friel-zones]). The offset per zone is `project default, tune`.
- **Retest** every 4–6 weeks; Friel recommends this for FTP, threshold pace and T-time. When a new test is logged, recompute zones and all future session targets.

### 8.2 Periodisation (back-calculated, weeks start Monday, "week 1" = race week)
Based on Friel's typical lengths (Prep 2–4, Base ~12, Build 8–9, Peak 1–2, Race 1), with Build starting 11–12 weeks out ([Friel: K.I.S.S. Periodization][friel-kiss], [Friel: Base 2 & 3][friel-base]):

| Phase | Weeks out | Dates (for 9 May 2027) | Focus |
|---|---|---|---|
| Prep | >24 | 10 Nov – 22 Nov 2026 | **1) Buy a bike. 2) Get a professional bike fit. 3) Book adult swim lessons.** Until the bike arrives, do indoor spin/stationary-bike sessions as a bridge. Do a Friel 30-min run test to confirm the VDOT estimate. Start strength work. If the bike or fit slips past Prep, Base starts anyway and the bike stays in "bridge" mode. |
| Base | 24–13 | 23 Nov 2026 – 14 Feb 2027 | Aerobic endurance and skills. Add Z3 muscular endurance in mid-Base, then Z4 threshold intervals late in Base. Longest sessions come at the end of Base. |
| Build | 12–4 | 15 Feb – 18 Apr 2027 | Race-specific work: race-pace and brick sessions get more frequent |
| Peak | 3 | 19 – 25 Apr 2027 | Race simulation, rest increases |
| Taper | 2–1 | 26 Apr – 9 May 2027 | See 8.4 |

- `buildPhases(raceDate, today, recoveryBlockWeeks)` is a pure function. If there are fewer weeks than ideal, shrink **Prep first, then Base**, and never cut the taper. That priority order is a project default.
- **Recovery weeks:** the last week of every block (3- or 4-week blocks) uses short, low-intensity sessions for 3–6 days ([Friel: Base 2 & 3][friel-base]). The volume reduction % is `project default, tune`.
- **Specificity rises toward the race:** "the closer in time you get to the race, the more like the race your workouts must become" ([Friel K.I.S.S.][friel-kiss]). Strength work drops to maintenance in mid-Base and to about once a week in late Base ([Friel: Base 2 & 3][friel-base]).

### 8.3 Intensity distribution
- About 80% of sessions are below the first threshold (easy). Use about two high-intensity sessions per week; more doesn't add much and raises stress ([Seiler & Tønnessen 2009][seiler]). For a triathlete the app treats "~2 hard sessions/week" as **total across sports**. That is a project interpretation.
- Seiler also notes that recreational athletes tend to drift into a threshold "black hole". The app flags weeks where too many logged sessions land in Z3/Z4.
- No anaerobic or VO2 work in Base 1. Base is "training to train" ([Friel: Base 2 & 3][friel-base]).
- **Base 2:** Z3 muscular endurance, e.g. 2×20 min (5-min recoveries) or 3×12 min (3-min recoveries). **Base 3:** Z4 intervals of 6–12 min with recoveries about 25% of the work time, building to 20–40 min of cumulative threshold work per sport per week ([Friel: Base 2 & 3][friel-base]).

### 8.4 Taper
- Taper for 2 weeks, cutting volume progressively (exponentially) by 41–60%. **Keep intensity and frequency the same** ([Bosquet et al. 2007 meta-analysis][bosquet]).

### 8.5 Sport priorities (generic rule + seed example)
Generic rule: priority goes to the sport with the biggest gap between its current estimate (or skill level) and what the goal tier and cut-offs need. Sports in skill mode facing a cut-off rank first. The ordering logic is a project default.

Seed example (novice swim/bike, strong run):
- **Swim: priority 1.** The 1:10 swim cut-off is the first thing that can end the race, so swim skill gets the most frequent sessions. Many short, frequent swims suit skill learning better than a few long ones. That's a project default; the coach's advice wins.
- **Bike: priority 2.** Safety and handling first, then aerobic volume. The 5:30 swim + T1 + bike cut-off is the second hard limit. The app tracks the minimum bike speed (§5.3).
- **Run: maintenance.** 2–3 runs per week (project default): one easy-aerobic, one shorter quality run (Friel zones from §4.1), and a long run capped well below his marathon-training volume to free time and limit injury risk. From Build, most run "quality" becomes **brick runs** (short runs straight off the bike at goal race pace, about 5:27/km).
- Strength: follows §8.10 if enabled.

### 8.6 Weekly session generation
- Inputs: phase (with any B/C race windows), week-in-block, availability (§3.2), strength (§3.3), discipline status, estimates, sport priorities.
- Output: 7 days, each holding 0–N sessions (N=2 only if `doubleSessionOk`), each `{sport, type, durationMin, structure[], targets (zone or skill), isKey}`.
- **Hard constraints** (never violated): rest days empty, day `maxMinutes`, per-sport max sessions, total sessions, strength spacing (§8.10), the hard-session limit (§8.3), no Z4+ in recovery or Base 1 weeks.
- **Soft goals** (met when possible, otherwise a warning): per-sport minimum sessions, the long-session day preference, target weekly hours, brick frequency.
- The split of hours across sports, the long-session caps and the brick frequency by phase are `project default, tune`. A brick is a bike followed straight away by a run, and appears from Build onward.
- Placement order: long sessions on the preferred days, then key sessions, then strength with spacing, then fill.

### 8.7 Adaptation (simple, explicit, tested)
- A new threshold test recalculates zones and future targets (§8.1, §8.11).
- A missed key session is **not** stacked onto the next day. It is either dropped or swapped with an easy day that week (project default).
- If weekly compliance is below a threshold (project default), the next load week repeats instead of progressing.
- A predicted finish later than 6:00 flags the weakest leg in the progress view and shows the tier that *is* on track.
- A skill checkpoint missed by its target date pushes later checkpoints back and raises a warning if S6 or B7 (below) would land after Peak week.
- **Ease me back in** (`easeBackIn(plan, missedDays, today)`): after ≥ 5 missed days (threshold `project default, tune`), offer a re-entry week at a reduced volume with no Z4+ sessions, then resume the normal progression. Volume % and length are `project default, tune`; sick mode (§6.2) uses the same function.
- **Every automatic change carries a reason.** `adapt` / `easeBackIn` / modes return `{ plan, warnings[], changes[] }`, where each change is `{ sessionId, kind: 'moved' | 'shortened' | 'dropped' | 'retargeted' | 'added', reasonCode, params }`. The UI turns reason codes into plain "Why this changed" notes (§6.4).

### 8.8 Skill tracks (novice mode)
A sport enters `skill` status when there's no numeric input for it, or the athlete picks a plain answer such as "can't swim 100 m yet" or "never ridden" (§6.4). While a discipline is in `skill` status, sessions have **checkpoint goals plus easy RPE targets, never zone targets**. Target dates are project defaults. Moving them is fine; the app re-plans.

**Swim** (sources: [USMS triathlon guide][usms-tri] recommends lessons with a coach experienced with adult learners; [USMS open-water guide][usms-ow] covers never swimming alone, a bright cap and tow float, checking conditions and treading water):
| # | Checkpoint | Target by |
|---|---|---|
| S0 | Adult lessons booked with an instructor who teaches adults/triathletes. Comfortable floating, breathing out underwater, treading water | end of Prep (22 Nov) |
| S1 | 25 m continuous freestyle | mid-Dec 2026 |
| S2 | 100 m continuous, relaxed breathing | early Jan 2027 |
| S3 | **400 m continuous**, so a CSS test (400 + 200) is possible. Swim switches to `zones` | mid-Jan 2027 |
| S4 | 1,000 m continuous. First **supervised** open-water/sea swim with a buddy, bright cap and tow float | mid-Feb 2027 (decision checkpoint) |
| S5 | 1.5 km continuous in open water with sighting and turns around a buoy | end of Mar 2027 |
| S6 | **1.9 km continuous in the sea**, comfortably under 1:10 (aim ≤ 0:55) | by Peak week (19–25 Apr 2027) |

Safety rules built into the app: open-water sessions show a checklist (buddy, bright cap, tow float, conditions/rips/weather checked). Never schedule a solo open-water swim.

**Bike** (sources: [USA Triathlon: How to learn to bike][usat-bike] covers practising unclipping on an indoor trainer, low-traffic routes, no music, riding with traffic and signalling; [220 Triathlon beginners][220-bike] covers basic fit checks; race draft rules are from the [2026 Athlete Guide][aig]):
| # | Checkpoint | Target by |
|---|---|---|
| B0 | **Bike bought + professional bike fit + helmet.** Until then, indoor spin/stationary-bike bridge sessions (aerobic, RPE-based) | ASAP, aim end of Prep |
| B1 | Empty car park skills: straight line, smooth braking, cornering, looking over the shoulder without swerving, one hand on the bars | 2 weeks after B0 |
| B2 | Clip in and out on an indoor trainer until it's automatic, then outdoors (unclip early) | 3 weeks after B0 |
| B3 | Quiet roads: traffic rules, signalling, low-traffic routes, no music | 4 weeks after B0 |
| B4 | Ride near others: one partner, then small groups. Learn the race rules (12 m draft zone, pass within 25 s, pass on the left) | 6 weeks after B0 |
| B5 | Eat and drink while riding. 2 h continuous ride. **First FTP test possible**, then bike switches to `zones` | mid-Feb 2027 at latest (decision checkpoint) |
| B6 | Aerobic volume (Base/Build zone rules apply). Weekly brick | Build |
| B7 | 90 km continuous with race fuelling, then a brick run | by Peak week |

The indoor trainer is the safe default for interval and early volume work, and it's where clipless practice belongs. Outdoor rides are needed for handling and race skills.

---

### 8.9 Feasibility warnings (never fail silently)
`checkFeasibility(settings, estimates, plan)` returns typed warnings. The generator **always returns a plan**, and every dropped or shortened session appears in `warnings[]` with a reason. Thresholds are `project default, tune` unless noted.
| Code | Trigger |
|---|---|
| `LONG_SESSION_CAP_TOO_LOW` | No available day's `maxMinutes` allows the long ride or run the phase needs. Example rule: Build needs a ride of at least X% of the predicted bike split |
| `SPORT_MIN_SESSIONS_UNMET` | A sport's minimum sessions don't fit the available days/caps |
| `HOURS_BELOW_PHASE_TARGET` | Available hours fall below the phase's target hours |
| `CUTOFF_RISK` | A predicted leg (or the cumulative time) exceeds a cut-off, or the margin is below the buffer. Uses the race's own cut-offs (sourced from the athlete guide) |
| `TIER_UNLIKELY` | The predicted finish misses a tier. Show which tier *is* on track |
| `SKILL_TIMELINE_RISK` | A skill checkpoint needed for a cut-off (e.g. S6) is projected after Peak week |
| `STRENGTH_CONFLICT` | The requested strength sessions can't meet the spacing rules; the generator drops some and explains which |
| `B_RACE_IN_TAPER` | A B race falls inside the A-race taper or the post-B recovery overlaps a key block |
The UI shows warnings at the top of the week view with a "fix" hint (e.g. "add 30 min to Saturday" or "allow a double session on Wednesday").

### 8.10 Strength training (optional)
- **Off by default**. When on: 0–3 sessions per week as the athlete asks, capped per phase below. If capped, a `STRENGTH_CONFLICT` warning explains why.
- **Dose while building strength:** about **2 sessions/week** for about 12 weeks, **4–10 RM, 2–3 sets, ~2–3 min rest**, with heavy loads. **Learn lifting technique with light loads first** ([Rønnestad & Mujika 2014][ronnestad]).
- **Maintenance:** about **1 low-volume, high-intensity session/week** keeps the strength gains in competition periods ([Rønnestad & Mujika 2014][ronnestad]).
- **By phase:** Prep / Base 1 build strength (up to 2, or 3 if asked: `project default, tune`). From Base 2, maintenance; about once a week in Base 3 ([Friel: Base 2 & 3][friel-base]). Build: 1/week maintenance. **Taper:** reduced to at most one light session in taper week 2 and none in race week. That taper rule is `project default, tune`; I found no source for it.
- **Placement:** keep strength **≥ 6 h apart, ideally on a different day, from key endurance sessions.** Recovery gaps under 6 h blunted strength and VO2 gains in a 7-week study ([Robineau et al. 2016][robineau]). Explosive-strength gains were reduced when done in the same session, but not with ≥3 h separation ([Schumann et al. 2022 meta-analysis][schumann]).
- If strength and endurance must share a session, strength first favours lower-body strength ([Eddens et al. 2018 meta-analysis][eddens]).
- Never the day before the long ride/run or a B race; at least 48 h between two strength sessions. Both are `project default, tune`.
- Novice note: Rønnestad & Mujika mention heavy, sore legs in the first days of a strength block. The app schedules the first 2 weeks of any strength block at light loads (`project default, tune`).

### 8.11 Performance estimators & best-estimate selection
Each estimator returns `{ value, unit, method, sourceUrl, confidence: 'high' | 'medium' | 'low', inputIds, estimated: boolean }`.
- **Run threshold pace:** a Friel 30-min test average pace is direct and high confidence ([Friel quick guide][friel-zones]). A race or TT from 1500 m to M goes through **Daniels VDOT table interpolation** to T pace ([VDOT tables][vdot]). Medium confidence; low for a marathon (endurance-limited, see §4.1: `project default`).
- **Swim:** a 400 + 200 test gives CSS = (T400 − T200)/2 ([TrainingPeaks][tp-tests]). A 1000 m TT gives Friel T-time = time/10 ([Friel quick guide][friel-zones]). A 400 m TT only gives 400 pace + 4–5 s ≈ CSS, per Simon Ward in [TrainingPeaks threshold tests][tp-tests]. Other distances convert with Riegel's endurance equation, using the **swimmer fatigue factor 1.03** ([Riegel 1981][riegel]). A 100 m alone is low confidence and the app suggests a 400 + 200 test.
- **Bike FTP:** 20-min average power × 0.95, or the 30-min average power (Friel) ([TrainingPeaks threshold tests][tp-tests]). A directly entered FTP (e.g. ramp test) is used as is. A **timed ride without power** gives no FTP: it's stored as a **speed benchmark** for bike-split prediction, adjusted for distance with a Riegel-style exponent (`project default, tune`), with a warning about terrain, wind and drafting. HR zones come from LTHR if given.
- **Best estimate per sport:** a field test beats a standalone race, which beats a B-race leg inside a triathlon, which beats a manual entry. Within a type, the more recent result wins. Inputs older than a recency window (e.g. 12 weeks) are demoted. This priority, the window and the tri-leg demotion are `project default, tune`.
- **Re-tailoring:** when a new input changes the best estimate, recompute zones, all future session targets, the predicted splits and tier status. Show a diff ("threshold pace 4:35 → 4:29/km, 14 future sessions updated"). Sports with no inputs stay in skill mode.

### 8.12 B and C races
- **Spacing:** Friel recommends no more than 3 A races a season, and B races only "with 2–3 days of rest before" ([Friel: find your next plan][friel-abc]). He warns that resting for many B races erodes fitness, so limit and spread them ([Friel: weak form & B races][friel-weak]). The app warns at more than one B race within N weeks (`project default, tune`).
- **Mini-taper:** B race: 2–3 easy/rest days before (Friel). C race: no taper, treated as a hard workout (Friel).
- **Recovery after:** easy days scaled by race duration, e.g. 2 days for ≤ 90 min, 3–4 for 90 min–3 h, 5–7 for > 3 h. All `project default, tune`.
- No B race in the A-race taper (warning); a B race replaces that week's key session for its sport(s).
- **Benchmarking:** after the race, the athlete logs total and per-leg times, conditions (temperature, wind, course notes) and RPE.
  - Leg times go through §8.11 as `B_RACE` inputs (tri legs demoted, open water and wetsuit noted).
  - The app shows **predicted A-race time** (per-leg predictions + transitions + heat adjustment), compares it with each tier (on track / at risk / off track), and plots it on the trend chart.

## 9. Heat, hydration & fuelling

**Heat acclimation** ([Racinais et al. 2015 consensus][racinais]):
- Acclimatise with repeated exercise-heat exposures over **1–2 weeks**, sessions of **at least 60 min/day** that raise core and skin temperature and make you sweat. Train in conditions like the race venue, or indoors in a hot room if you can't.
- Most adaptations happen in the first week. Near-complete adaptation takes about 6–10 days, and about 2 weeks gives the best aerobic performance in the heat.
- If you already train outdoors in a hot, humid climate, much of this happens naturally. Still schedule some race-time-of-day sessions (e.g. bricks that finish late morning).
- App feature: in the last 2–3 weeks, tag sessions as "heat exposure" and track the count against the 1–2 week guidance.

**Hydration** ([ACSM/AND/DC 2016 position paper][acsm]):
- Start well hydrated: about 5–10 ml/kg body mass in the 2–4 h before exercise.
- During exercise, aim to keep the body-mass loss under 2%. Losses above 2% can hurt aerobic performance, especially in the heat.
- **Sweat-rate test:** weigh yourself before and after (1 kg ≈ 1 L), counting what you drank. Sweat rates range from 0.3 to 2.4 L/h. Many athletes' plans land at 0.4–0.8 L/h, *customised*.
- **Sodium** matters for sweat rates above 1.2 L/h, salty sweat, or sessions over 2 h. Average sweat sodium is about 1 g/L.
- **Do not overdrink.** Drinking more than you sweat is the main cause of hyponatraemia.

**Fuelling** (same paper): **30–60 g carbohydrate/h** for 1–2.5 h efforts, **up to 90 g/h** for efforts over 2.5–3 h. The bike leg alone is about 3 h, so practise race-day intake on long rides and bricks.

**Fuel & fluid planner (feature):** inputs are sweat rate, body mass, planned leg times and the aid-station km list from §2. The output is a per-hour and per-aid-station plan for carbs, fluid and sodium. It warns if the plan exceeds the sweat rate (overdrinking) or allows more than 2% mass loss.

**Heat-adjusted pacing (feature):**
- Ely et al. 2007 analysed marathon results at WBGT 5–25 °C. Slower runners slowed more: 300th-place finishers (about 3-hour marathoners) lost about **3.2% per 5 °C** rise in WBGT, while elites lost about 0.9% ([Ely et al. 2007][ely]).
- `adjustRunPaceForHeat(paceSecPerKm, wbgtC)` uses `HEAT_SLOWDOWN_PCT_PER_5C_WBGT = 3.2` relative to the coolest studied band (5–10 °C).
- **Warn** whenever WBGT > 25 °C: that is outside the studied range, so the result is an extrapolation.
- Bike and swim adjustment defaults to 0. There's no sourced number, so the user sets it.
- WBGT is entered manually from a forecast. Don't compute it from temperature alone.
- Use it both ways: convert cool-day training paces to a Da Nang race target, and turn race targets into "what this should feel like" in training.

---

## 10. Milestones: one Cursor chat each

Each milestone is a small, self-contained agent task. **Definition of done for every milestone:** `npm test`, `npx tsc --noEmit` and `npm run lint` all pass, the acceptance check passes, and you've made a commit.

**Phase A: core logic (pure TS, TDD, no UI)**
| # | Task | Acceptance check |
|---|---|---|
| M0 | Scaffold Next.js + TS strict + Vitest + ESLint + Prisma (SQLite). Add `npm test` and `typecheck` scripts. Copy the `seed/` folder. | `npm test` runs 1 sample test green, `npm run dev` serves a page, `tsc` clean |
| M1 | **TDD** `time.ts` + `units.ts`: h:mm:ss, pace↔speed, sec/100 m, sec/km↔sec/mi, °C↔°F. | Edge cases (0, >1 h, rounding, mi↔km round-trip) written first, then green |
| M2 | **TDD** `constants.ts` + `zones.ts`: Coggan, Friel run pace and HR, CSS ± seconds. `null` gives "test needed". | FTP 250 W gives Z2 140–188 W. CSS 6:00/3:00 gives 90 s/100 m. `null` FTP gives `{ok:false,error:'test-needed'}`. Every constant has a SOURCE comment. |
| M3 | **TDD** `estimators/` (run VDOT, swim CSS/T-time/400-only/Riegel 1.03, bike 20/30-min/direct FTP/speed benchmark) + `bestEstimate()` (§8.11). | HM 1:39:00 gives T ≈275 s/km (±3). 20-min 263 W gives FTP 250 W. 1000 m in 18:20 gives T-time 110 s/100 m. A field test beats a race. An input older than the window is demoted. A timed ride gives no FTP and is tagged speed benchmark. |
| M4 | **TDD** `pacing.ts`: tiers to splits, generic cut-offs, min speed per cut-off, predicted finish from estimates. | Seed: 5:56:00, bike 30.0 km/h, run ≈5:27/km, min bike ≈19.8 km/h. A split that breaks a cut-off gives an error. |
| M5 | **TDD** `heat.ts`: `adjustRunPaceForHeat` (+ warning > 25 °C WBGT). | 0% at 10 °C, +3.2% at 15 °C, `extrapolated` at 28 °C |
| M6 | **TDD** `phases.ts` + `races.ts`: A-race back-calculation, then B/C windows (mini-taper, recovery, `B_RACE_IN_TAPER`, spacing warning). | Seed dates reproduced. A B race on a Sunday gets 2–3 easy days before and duration-scaled recovery after. A C race gets no taper. A B race in the taper raises a warning. |
| M7 | **TDD** `skills.ts`: swim/bike checkpoints, slip propagation, test triggers, equipment gating. | S3 gives a CSS prompt, B5 gives an FTP prompt. `hasBike:false` never yields an outdoor ride. Late S6/B7 gives `SKILL_TIMELINE_RISK`. |
| M8 | **TDD** `availability.ts`: slot model from §3.2 + `checkFeasibility()` (§8.9). | A fixture with 3 days × 45 min yields `LONG_SESSION_CAP_TOO_LOW` and `SPORT_MIN_SESSIONS_UNMET`. A generous fixture yields no warnings. |
| M9 | **TDD** `strength.ts`: phase dose, caps, placement and spacing rules (§8.10). | Spacing ≥ 6 h from key sessions, never the day before the long day, none in race week. A request for 3/week in Build is capped to 1 with `STRENGTH_CONFLICT`. |
| M10 | **TDD** `sessions.ts`: generator using M6–M9, hard vs soft constraints (§8.6). | Property tests over random availability fixtures: hard constraints never broken, every dropped session appears in `warnings[]`, skill sports get no zone targets, taper volume down 41–60% with frequency kept. |
| M11 | **TDD** `fuel.ts`: per-hour and per-aid-station plan. | Warns on >2% loss and on overdrinking. Seed aid stations map correctly. |

**Phase B: data + core UI** (design system and components come before any screen; see `DESIGN.md`)
| # | Task | Acceptance check |
|---|---|---|
| M12 | Prisma schema (data model below) + repositories + seed from `seed/athlete-profile.json`. | `npx prisma db seed` loads Wisnu's example. Repository tests round-trip every entity. |
| M13 | **Design tokens + theme + app shell**: import `design/tokens.css` and `design/tailwind-theme.css` (Tailwind v4) in `globals.css`, load Plus Jakarta Sans + Barlow Semi Condensed with `next/font`, theme preference → `data-theme` (light/dark/system, no flash), app shell with bottom **TabBar** (Today, Plan, Progress, Races, Settings) and empty routes. | Integrated browser at 390 px: tab bar renders in light and dark, theme toggle persists after reload, no console errors. A test asserts every token pair in DESIGN.md §3.4 still meets its ratio (contrast helper in `src/lib/ui/contrast.ts`). `bg-blue-500` doesn't compile. |
| M14 | **Component library** (`src/components/ui/`, DESIGN.md §4): SessionCard, DayStack, WeekStrip, WeekHeader, IntensityBars, StepList, ZoneChip/SkillChip, RaceCountdown, TierBadge, WarningBanner, BRaceMarker, LoadRing, CheckpointTrack, PhaseTimeline, TrendChart, Fuel/HeatCard, buttons, segmented control, stepper, sheet. Static `/dev/components` gallery with seed-shaped fixtures. | Gallery shows every component and state (planned/done/missed, skill vs zone, on track/at risk/off track/needs data) in light and dark, matching `design/mockups/*.png` in layout. Components take props only (no DB or training imports, enforced by an ESLint import rule). Keyboard focus visible; no drag-only action. |
| M15 | Onboarding & settings UI (DESIGN.md §5.1, §5.8): race and tiers, availability grid, strength toggle, equipment, performance inputs, B/C races, units. | Integrated browser: changing availability re-plans future weeks and shows warnings. Entering a 5k changes run zones. No console errors. |
| M16 | Today / Plan (week, month, phases) / Session detail + workout logging + **missed-session handling** (§6.2; DESIGN.md §5.2–5.5). Includes **one primary action per screen** (Today: Start / Log it / Rest day) and **one-tap logging** ("Done as planned", details only if different, RPE 1–10 slider with faces) (§6.4). | Missing a key session offers skip/move only to valid slots, and nothing is ever stacked onto the next day. Each screen renders exactly one primary button. "Done as planned" logs a planned session in one tap, copying planned values. Today matches mockup 02 for the seed. |
| M17 | **Quick start & plain language** (§6.4 items 1–3, 10; DESIGN.md §5.9): 3-step quick-start onboarding (race, goal, training days) with defaults for the rest; "I don't know" / plain answers on every fitness question → skill mode; sample-week preview with *too much / too little*; "Finish your profile" card on Today; plain-language labels next to jargon + tappable glossary sheet. | Integrated browser: a new athlete reaches a first plan in ≤ 3 steps without typing any fitness number (timed run-through under ~2 min). Answering "can't swim 100 m yet" sets swim to skill mode. *Too much* lowers the sample week's volume one step and re-shows it. Every zone chip shows its plain label; FTP, CSS, brick and taper open a glossary entry. Profile card disappears once all sections are done. |
| M18 | `adapt.ts` (**TDD**): new inputs → re-tailor with diff. B-race result → benchmark → predicted A-race time + tier status. Every adaptation returns `changes[]` with a reason code, rendered as a **"Why this changed"** note (§6.4 item 7). | Logging a faster 10k updates targets and shows the "N sessions updated" diff. Logging a B-race tri updates predictions and tier badges. Every changed session carries a reason code; no change without one (property test). |
| M19 | Progress (DESIGN.md §5.6): predicted-time trend chart + weekly load summary + checkpoints, with **teaching empty states** (§6.4 item 11). | Chart shows tier lines and a point per estimate change. The weekly summary matches the logs. A fresh athlete sees "Log 3 sessions to see your first trend" (threshold `project default, tune`) instead of an empty chart. |
| M20 | Races + race-day page (DESIGN.md §5.7): splits, cut-off margins, heat-adjusted run, fuel plan per aid station. | Seed race renders every aid station with quantities. Cut-off margins shown. |

**Phase C: must-have QoL**
| # | Task | Acceptance check |
|---|---|---|
| M21 | Drag-and-drop / swap with auto-rebalance (reuses the generator's validation), plus the **Move** button flow as the non-drag alternative. | An invalid move (rest day, over `maxMinutes`, strength spacing) is rejected with a reason. A valid move rebalances and keeps the constraints. Every move is possible without dragging. |
| M22 | Sick / travel / injury mode (`modes.ts`, **TDD**). | Sick range clears sessions and adds easy re-entry. Travel override respected. Injury removes only the selected sports. Tier status re-evaluated. |
| M23 | **First-week guidance & forgiveness** (§6.4 items 4, 8, 9, 12; DESIGN.md §5.9): 3-screen tour + one-time contextual tips; **undo** on every move/skip/edit/log; **"Ease me back in"** after missed time (`ease.ts`, **TDD**); small-win celebrations for checkpoints and firsts; contextual beginner safety prompts. | Tour shows once and can be replayed from Settings; each tip shows once per screen. Every move/skip/edit/log shows an undo toast and undo restores the exact previous state (test). After ≥ N missed days (`project default, tune`) Today offers *Ease me back in*, which lowers the next week per §8.7. Passing S1 shows a celebration once. The first open-water session and first outdoor clip-in ride show their safety prompt before Start. |
| M24 | `.ics` calendar export + JSON/CSV export + validated JSON import (dry-run diff). | The .ics file is valid for a calendar app (one event per session). Export → import round-trip is lossless. |
| M25 | Race-week checklist & packing list + units/mobile polish. | Checklist generated for the seed race (no-wetsuit note, heat kit). Lighthouse/responsive check on a phone viewport. |
| M26 | Review pass: Agent Review on the branch, fix issues, regression tests, update rules. | Findings resolved or recorded; all checks green |

Later backlog (§6.3) gets its own milestones only when you decide to build it.

Data model (Prisma, M12):
```
Athlete(id, name, bodyMassKg?, sweatRateLPerH?, recoveryBlockWeeks, preferences Json{units, tempUnit, weekStart, theme, homeLocation?})
Equipment(athleteId, hasBike, bikeFitDone, hasIndoorTrainer, hasClipless, hasPowerMeter, hasHrMonitor, poolAccess, openWaterAccess)
Availability(athleteId, sessionsTotalMax, swimMin, swimMax, bikeMin, bikeMax, runMin, runMax,
             days Json[{weekday, available, maxMinutes, doubleSessionOk}], restDays Json, longRideDay?, longRunDay?, brickDay?)
StrengthSettings(athleteId, enabled, sessionsPerWeek 0..3, preferredDays Json?, equipment[GYM|HOME|BODYWEIGHT])
DisciplineStatus(athleteId, sport[SWIM|BIKE|RUN], status[SKILL|ZONES], selfReport?[CANT_YET|NEVER|BEGINNER|REGULAR|UNKNOWN])
Race(id, athleteId, priority[A|B|C], type, name, date, legs Json[{sport, distanceM}], startTimeLocal?, cutoffs Json?, aidStations Json?, climateNote?)
GoalTier(id, raceId, code, finishUnderSec?, bufferSec, splits Json?)
RaceResult(id, raceId, totalSec?, legs Json[{sport, timeSec}], conditions Json?, rpe?)
PerformanceInput(id, athleteId, sport, kind[RACE|TT|CSS_TEST|FTP_DIRECT|POWER_20|POWER_30|RUN_30|TIMED_RIDE|LTHR], distanceM?, timeSec?, powerW?, hr?,
                 date, source[FIELD_TEST|RACE|B_RACE|MANUAL], raceResultId?, conditionsNote?)
Estimate(id, athleteId, sport, metric[RUN_T_PACE|CSS|FTP|BIKE_SPEED_BENCH|LTHR], value, method, confidence, inputIds Json, isBest, createdAt)
SkillCheckpoint(id, athleteId, sport, code, description, targetDate, doneDate?)
PlannedSession(id, athleteId, date, phase, weekOut, sport[SWIM|BIKE|RUN|BRICK|STRENGTH], type, durationMin, structure Json, targets Json, isKey, generatedBy, overrideOf?)
WorkoutLog(id, plannedSessionId?, date, sport, durationMin, distanceM?, avgPower?, avgPaceSec?, avgHr?, rpe, status[DONE|PARTIAL|MISSED|SKIPPED], notes, heatExposure)
PlanEvent(id, athleteId, kind[SICK|TRAVEL|INJURY], start, end, affectedSports Json?, availabilityOverride Json?)
PlanWarning(id, athleteId, weekStart, code, message, fixHint?)
PlanChange(id, athleteId, createdAt, sessionId?, kind, reasonCode, params Json, source[ADAPT|MISSED|MODE|TEST|USER], undoOf?, undoneAt?)   // "Why this changed" + undo history
UiState(athleteId, onboarding[QUICK|FULL], profileSections Json, volumeScale, tourDoneAt?, seenTips Json, celebrated Json, safetyPromptsSeen Json)
ChecklistItem(id, raceId, kind[RACE_WEEK|PACKING], text, done)
```

---

## 11. How to work with Cursor on this

These map the course practices from my study notes onto this build.

1. **Explore and plan before coding.** Start each milestone in **Plan Mode** (Shift+Tab). Paste the milestone row and `@PLAN.md`. Answer its clarifying questions and trim the plan to that milestone only, then click Build.
2. **One milestone per chat.** Start a new chat when you switch milestones or when the agent starts going in circles. Reference the earlier chat rather than continuing it. This keeps context small, the answers focused and token costs down.
3. **Be specific; tag files.** Use `@PLAN.md`, `@src/lib/training/constants.ts` and the relevant test file. Name the function signature you want and point to an existing file as the pattern to follow.
4. **TDD for every `lib/training` function.** Say "this is TDD, don't mock code that doesn't exist yet". Have it write the tests from the input/output examples in §10, confirm they **fail**, and **commit the tests**. Then ask it to make them pass *without changing the tests*.
5. **Verification gives the agent feedback.** Tests, `tsc` and ESLint run on every milestone. Use the integrated browser for UI milestones (M13 onward) at a 390 px phone width, in light and dark, to check rendering and console errors; compare with `design/mockups/*.png`.
6. **Watch the diff and stop scope creep.** If it touches files outside the milestone, stop it (Cmd/Ctrl+Shift+Backspace). If the build misses, **revert, make the plan more specific and rerun it**. Don't pile on patch prompts.
7. **Small semantic commits.** Commit after tests are written, then after they pass. One logical change per commit.
8. **Bugs:** for clear errors, paste the stack trace plus when it happens. For tricky ones (e.g. week boundaries in `buildPhases`, B-race windows overlapping, or a generator that drops a session without a warning), use **Debug Mode**: form a hypothesis, add logging, reproduce, then make a targeted fix. Always add a regression test. Don't accept a fix you don't understand, such as a null check that hides bad data.
9. **Start with the logic, not the UI.** Phase A (M1–M11) is pure functions with tests. Get it right before any UI. M8–M10 (availability, strength, generator) are the heart; give each its own chat and use **property-style tests with random availability fixtures** so the generator can't silently break constraints.
10. **Treat training numbers with suspicion.** The agent may invent plausible zone percentages. Every constant must carry a SOURCE comment. If it can't cite one, it must say `project default, tune`.
11. **Rules, kept few.** `.cursor/rules/*.mdc` (see below) plus `AGENTS.md`. When the agent repeats a mistake, add one short line to a rule, the way the course's "Step 5: write a rule" suggests.
12. **Review before calling it done.** Run Agent Review / "what would a reviewer flag?" at the end of each UI milestone and at M26.
13. **Costs.** Long chats resend all their context, and output tokens cost more than input. Keep chats short, ask for concise answers, and don't paste whole files when `@`-tagging will do.

---

## 12. Sources (all fetched 10 Nov 2026)

[im-race]: https://www.ironman.com/races/im703-danang
[course]: https://www.ironman.com/races/im703-danang/course
[aig]: https://www.ironman.com/sites/default/files/2026-05/IM70.3DN2026_AIG_ENG.pdf
[bikemap]: https://www.ironman.com/sites/default/files/2026-08/02-IM70.3DN%202026%20-%20BIKE.pdf
[rules]: https://ironman.com/sites/default/files/2026-02/2026%20IRONMAN%20Competition%20Rules_Final_V2.pdf
[im-dist]: https://www.ironman.com/stories/intro-triathlon/find-ironman-race-for-you
[wx]: https://weatherspark.com/m/149146/5/Average-Weather-in-May-at-Da-Nang-International-Airport-Vietnam
[coggan]: https://www.trainingpeaks.com/blog/power-training-levels/
[friel-zones]: https://www.trainingpeaks.com/learn/articles/joe-friel-s-quick-guide-to-setting-zones/
[tp-tests]: https://www.trainingpeaks.com/blog/threshold-tests-for-swim-bike-and-run/
[friel-kiss]: https://joefrieltraining.com/kiss-periodization/
[friel-base]: https://joefrieltraining.com/training-in-base-2-and-3/
[seiler]: https://sportsci.org/2009/ss.htm
[bosquet]: https://pubmed.ncbi.nlm.nih.gov/17762369/
[racinais]: https://onlinelibrary.wiley.com/doi/10.1111/sms.12467
[acsm]: https://www.dietitians.ca/DietitiansOfCanada/media/Documents/Resources/noap-position-paper.pdf
[ely]: https://pubmed.ncbi.nlm.nih.gov/17473775/
[vdot]: https://coacheseducation.com/pdfs/vdot-tables.pdf
[usms-tri]: https://www.usms.org/fitness-and-training/guides/triathlon
[usms-ow]: https://www.usms.org/fitness-and-training/guides/open-water-swimming-101
[usat-bike]: https://www.usatriathlon.org/training-tips/how-to-learn-to-bike
[220-bike]: https://www.220triathlon.com/training/beginners/how-to-start-cycling
[ronnestad]: https://pubmed.ncbi.nlm.nih.gov/23914932/
[robineau]: https://journals.lww.com/nsca-jscr/fulltext/2016/03000/specific_training_effects_of_concurrent_aerobic.10.aspx
[schumann]: https://pmc.ncbi.nlm.nih.gov/articles/PMC8891239/
[eddens]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5752732/
[friel-abc]: https://joefrieltraining.com/find-your-next-training-plan-using-my-new-site/
[friel-weak]: https://www.trainingbible.com/joesblog/2008/08/weak-form-and-b-priority-races.html
[riegel]: https://rrtc.net/Articles/ARHE.pdf

- IRONMAN 70.3 Da Nang race page, course page, 2026 Athlete Information Guide and 2026 bike map: ironman.com
- IRONMAN 2026 Competition Rules, §4.02 (wetsuits)
- WeatherSpark, May climate at Da Nang International Airport
- Coggan power levels (TrainingPeaks); Joe Friel's Quick Guide to Setting Zones (TrainingPeaks); TrainingPeaks threshold tests (CSS)
- Friel, "K.I.S.S. Periodization" (2010) and "Training in Base 2 and 3" (2010)
- Seiler & Tønnessen, "Intervals, Thresholds, and Long Slow Distance", *Sportscience* 13 (2009)
- Bosquet et al., "Effects of tapering on performance: a meta-analysis", *MSSE* 39(8) (2007)
- Racinais et al., "Consensus recommendations on training and competing in the heat", *SJMSS* (2015)
- Thomas, Erdman, Burke, "Nutrition and Athletic Performance" position paper, ACSM/AND/DC (2016)
- Ely et al., "Impact of weather on marathon-running performance", *MSSE* 39(3) (2007)
- Jack Daniels' VDOT tables (Daniels' Running Formula), PDF via Coaches Education
- U.S. Masters Swimming: Triathlon swim training guide; Open water swimming guide
- USA Triathlon: How to learn to bike; 220 Triathlon: Cycling for beginners
- Rønnestad & Mujika, "Optimizing strength training for running and cycling endurance performance: A review", *SJMSS* (2014)
- Robineau et al., "Specific training effects of concurrent aerobic and strength exercises depend on recovery duration", *JSCR* 30(3) (2016)
- Schumann et al., "Compatibility of concurrent aerobic and strength training...: updated systematic review and meta-analysis", *Sports Med* (2022)
- Eddens et al., "The role of intra-session exercise sequence in the interference effect: systematic review with meta-analysis", *Sports Med* (2018)
- Friel, "Find your next training plan using my new site" (A/B/C race priorities); "Weak Form and B-Priority Races" (2008)
- Riegel, "Athletic Records and Human Endurance", *American Scientist* 69(3) (1981)
