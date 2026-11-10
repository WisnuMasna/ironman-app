# PLAN: Personal IRONMAN 70.3 Training App (IRONMAN 70.3 Da Nang, stretch goal sub-6:00)

> Feed this file to Cursor with `@PLAN.md`. Build **one milestone per chat** (see §9 and §10).
> Anything marked `TODO(Wisnu)` is a personal number for you to fill in after testing.
> Not medical advice. Get a check-up before a big training block, especially for racing in the heat.

---

## 1. Product goal

A single-user web app that:
1. Takes my race, goal time and fitness test results.
2. Builds a periodised plan that counts back from race day: Prep → Base → Build → Peak → Taper.
3. Sets every session's targets from my own zones: power, pace and CSS.
4. Turns the sub-6:00 goal into per-leg pacing, and adjusts that pacing for heat.
5. Lets me log workouts and retests, then adapts the remaining plan.
6. Shows my progress against the plan.

**Success:** I open the app each morning and know exactly what to do today and at what intensity. I can also see whether I'm on track for sub-6.

---

## 2. Race facts (defaults, sourced)

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

## 3. Athlete profile (Wisnu, as of 10 Nov 2026)

**Starting point:** a strong runner (1:39:00 half marathon, 3:49:00 marathon), **has never cycled and has no bike yet**, and **barely swims**. The plan and the app are built around that.

| Field | Default | Notes |
|---|---|---|
| `race.name` / `race.date` | IRONMAN 70.3 Da Nang / 2027-05-09 | from §2 |
| `goal.finishTime` | stretch **< 6:00:00** (see §4 for the goal tiers) | Wisnu's goal |
| `equipment.hasBike` | **false** | Until it's true, bike sessions are indoor spin/stationary-bike sessions (§7.8) |
| `equipment.bikeFitDone` / `hasIndoorTrainer` / `hasClipless` | false / false / false | These gate the bike skill milestones |
| `disciplineStatus.swim` | **`skill`** | Skill checkpoints instead of zones until a CSS test is possible (§7.8) |
| `disciplineStatus.bike` | **`skill`** | Skill checkpoints instead of zones until an FTP test is possible |
| `disciplineStatus.run` | `zones` | Proven runner |
| `raceResults` | HM 1:39:00, M 3:49:00 | Dates and conditions: `TODO(Wisnu)` |
| `fitness.thresholdRunPaceSecPerKm` | **275 (≈4:35/km), *estimated*** | Daniels VDOT from the HM. Confirm with Friel's 30-min test in Prep (§7.1) |
| `fitness.ftpWatts` | `null` (novice) | First FTP test once bike skills checkpoint B5 is done |
| `fitness.cssSecPer100m` | `null` (novice) | First CSS test once swim checkpoint S3 is done (400 m continuous) |
| `fitness.lthrBike` / `fitness.lthrRun` | `TODO(Wisnu)` (optional) | |
| `fitness.bodyMassKg` / `sweatRateLPerH` | `TODO(Wisnu)` | for fluid planning (§8) |
| `schedule.weeklyHoursAvailable` / `restDays` / `longDay` | `TODO(Wisnu)` | |
| `schedule.recoveryBlockWeeks` | `3` | Friel suggests 3-week blocks for novices ([Friel, Base 2 & 3][friel-base]) |

### 3.1 Run threshold estimated from race results
Method: **Jack Daniels' VDOT tables** ([VDOT tables PDF][vdot]).
- **HM 1:39:00** falls between VDOT 45 (HM 1:40:20) and VDOT 46 (HM 1:38:27), so **VDOT ≈ 45.7**. Daniels' **T (threshold) pace** is 4:38/km at VDOT 45 and 4:33/km at VDOT 46, which gives **≈ 4:35/km (275 s/km)**.
- **M 3:49:00** gives roughly VDOT 40 (M 3:49:45), with a T pace of 5:06/km.
- The app uses the **HM-derived value**. A half marathon is much closer to threshold duration than a marathon, and marathon results depend heavily on endurance and fuelling. That is my reasoning, not a quote from Daniels.
- The gap between the two VDOTs (≈46 vs 40) suggests long-duration endurance is the limiter, which matters for a ~6 h race.
- This is an **estimate**. Daniels' T pace and Friel's 30-min-TT threshold pace are related but not identical. Replace the estimate with a real Friel 30-min test in Prep.

## 4. Goal & split: honest version

### 4.1 Goal tiers
IRONMAN says first-timers *often finish in 6:30–8:00* ([ironman.com distances][im-dist]). Wisnu's run is well above beginner level, but he is starting from zero on the bike and near zero in the water, with ~26 weeks to go. So:
- **A goal: finish safely inside every cut-off.** Swim ≤ 1:10. Swim + T1 + bike ≤ 5:30. Total ≤ 8:30.
- **B goal: sub-6:30.**
- **Stretch: sub-6:00.**

The app shows all three and recomputes which one is on track after every test.

### 4.2 Starting split for the stretch goal (recompute after tests)
| Leg | Target | Implied pace | Reasoning |
|---|---|---|---|
| Swim 1.9 km | **0:50:00** | ~2:38 /100 m | Conservative. For a near-non-swimmer, the real goal is swimming 1.9 km continuously in the sea, with no wetsuit likely (§2). 50 min leaves 20 min to the 1:10 cut-off. Seed in the ">44 min" start zone. |
| T1 | **0:07:00** | — | Beach run plus a first-timer's transition. A budget assumption. |
| Bike 90 km | **3:00:00** | 30.0 km/h | The make-or-break leg. Flat course with ~278 m gain, but it's a big ask for someone who has never ridden (see 4.3). |
| T2 | **0:04:00** | — | A budget assumption. |
| Run 21.1 km | **1:55:00** | ~5:27 /km | Faster than the old 2:10 because the run is the proven leg. 5:27/km is about his **marathon race pace** (3:49:00 is 5:26/km) and close to his Daniels *Easy* pace at VDOT 45–46 (5:28–5:34/km, [VDOT tables][vdot]). That's about 16% slower than his open HM pace (4:42/km). The margin covers late-morning heat (Ely et al. 2007 shows bigger slowdowns for slower runners as WBGT rises; §8) and fatigue after his first-ever 3 h ride. I found no source for an "off-the-bike" penalty, so that part is a judgement call. |
| **Total** | **5:56:00** | | 4:00 buffer under 6:00:00 |

### 4.3 Is sub-6 realistic? Plain answer
- **Possible, but a genuine stretch, and it rests almost entirely on the bike.** The run (≈1:55) is very likely achievable for a 1:39 half marathoner. The swim (~50 min) is plausible if lessons start now and he reaches continuous swimming by mid-Jan.
- Averaging **30 km/h for 90 km in heat, ~6 months after first getting on a bike**, is the big unknown. I couldn't find data to put odds on it, so I won't.
- Every extra 10 min on the bike (3:10 ≈ 28.4 km/h) or swim pushes the finish past 6:00 unless the run is faster.
- **Decision checkpoint, mid-February 2027 (end of Base):** by then he should have a first FTP test and a 1.9 km continuous pool swim. The app predicts bike speed from FTP (as a user-tuned estimate, since no sourced power-to-speed model is in this plan), recalculates the splits, and says which tier is on track.
- **Cut-off safety is not at risk at sub-6 pace:** swim + T1 + bike would be about 3:57, against a 5:30 limit. Even so, the minimum bike average to make the 5:30 cut-off after a 57-min swim + T1 is **≈19.8 km/h**. The app shows this "must-not-go-below" number.

## 5. Core features (MVP)

1. **Profile, equipment & tests.** Enter race, goal tiers, equipment status (`hasBike`, `bikeFitDone`, `hasIndoorTrainer`, `hasClipless`), per-discipline status (`skill` or `zones`) and threshold tests, with a test history. Includes a CSS calculator from 400/200 times.
2. **Race-result threshold estimator.** Enter a recent race (distance + time) to get the Daniels VDOT and an *estimated* threshold run pace (§3.1). It's flagged as an estimate until a field test replaces it.
3. **Zones.** Bike power zones (Coggan), run pace zones (Friel), swim zones (CSS ± seconds), and optional HR zones.
4. **Periodised plan.** Phases counted back from 9 May 2027, recovery weeks, and a 2-week taper (§7).
5. **Skill tracks (novice mode).** For a discipline in `skill` status, sessions are built from **skill checkpoints** (§7.8) with time/distance and RPE targets instead of zones. When the checkpoint that makes a fitness test possible is ticked, the app prompts for the test. Once the test is logged, the discipline switches to `zones`.
6. **Weekly sessions.** Swim, bike, run, brick and strength sessions, placed around rest days and the long day. Each has a duration, a structure and either zone targets or skill targets. If `hasBike` is false, bike sessions become indoor spin/stationary-bike sessions.
7. **Race pacing calculator.** Goal tier to split targets to per-leg pace, speed or power, plus T1/T2. Cut-off checks, including the minimum bike speed that still makes the 5:30 swim + T1 + bike cut-off.
8. **Heat-adjusted pacing.** Enter the forecast WBGT and get an adjusted run pace target, with clear warnings (§8).
9. **Fuel & fluid planner.** Uses your sweat rate, body mass and the race aid-station positions to plan carbs, fluid and sodium per hour and per aid station (§8).
10. **Workout log & adaptation.** Log what you did (duration, distance, average power/pace/HR, RPE, notes, missed/done). The plan adapts (§7.7).
11. **Progress view.** Planned vs completed hours per week and per sport, skill checkpoints done vs their target dates, threshold trends, and which goal tier (cut-offs / sub-6:30 / sub-6) is currently on track.

Out of scope for the MVP: device sync (Strava/Garmin), multi-user, auth, mobile app, AI coaching chat.

---

## 6. Stack (beginner-friendly, single user)

- **Next.js (App Router) + TypeScript (`strict`)**: UI and server in one project, with lots of examples. *Tell the agent to check the current Next.js docs for setup commands rather than rely on memory* (the course warns about knowledge cutoffs).
- **SQLite + Prisma**: a single file DB, no server to run, typed queries, easy reset and seed.
- **Vitest**: fast unit tests for the training logic. That logic is pure TypeScript, so it doesn't depend on Next.js.
- **ESLint + `tsc --noEmit`**: lint and type-check feedback that the agent can read.
- **Tailwind**: optional, for quick styling.

Folder layout:
```
src/
  lib/training/        # PURE functions only: zones, vdot, skills, phases, sessions, pacing, heat, fuel, adapt
    constants.ts       # every number, each with a SOURCE comment
    *.ts / *.test.ts
  lib/db/              # Prisma client + repository functions
  app/                 # Next.js routes/pages (thin: call lib, render)
prisma/schema.prisma
seed/athlete-profile.json
```

---

## 7. Training logic rules (sourced)

Every number lives in `src/lib/training/constants.ts` with a `// SOURCE:` comment. A number with no source is tagged `// SOURCE: project default, tune` so it's obvious it's a guess.

### 7.1 Zones
- **Bike power (Coggan, % FTP):** Z1 ≤55, Z2 56–75, Z3 76–90, Z4 91–105, Z5 106–120, Z6 121–150, Z7 >150. [TrainingPeaks: Coggan levels][coggan]
- **Run pace (Friel, % of threshold *pace*; a higher % means slower):** Z1 slower than 129%, Z2 114–129%, Z3 106–113%, Z4 99–105%, Z5a 97–100%, Z5b 90–96%, Z5c faster than 90%. [Friel quick guide][friel-zones]
- **Run/bike HR (Friel, % LTHR):** Run Z1 <85, Z2 85–89, Z3 90–94, Z4 95–99, Z5a 100–102, Z5b 103–106, Z5c >106. Bike Z1 <81, Z2 81–89, Z3 90–93, Z4 94–99, Z5a 100–102, Z5b 103–106, Z5c >106. [Friel quick guide][friel-zones]
- **Swim:** CSS pace per 100 m = `(T400 − T200) / 2` in seconds ([TrainingPeaks threshold tests][tp-tests]). Express swim targets as **CSS ± seconds**, following Friel's "T-time + 5 s" convention ([Friel quick guide][friel-zones]). The offset per zone is `project default, tune`.
- **Retest** every 4–6 weeks; Friel recommends this for FTP, threshold pace and T-time. When a new test is logged, recompute zones and all future session targets.

### 7.2 Periodisation (back-calculated, weeks start Monday, "week 1" = race week)
Based on Friel's typical lengths (Prep 2–4, Base ~12, Build 8–9, Peak 1–2, Race 1), with Build starting 11–12 weeks out ([Friel: K.I.S.S. Periodization][friel-kiss], [Friel: Base 2 & 3][friel-base]):

| Phase | Weeks out | Dates (for 9 May 2027) | Focus |
|---|---|---|---|
| Prep | >24 | 10 Nov – 22 Nov 2026 | **1) Buy a bike. 2) Get a professional bike fit. 3) Book adult swim lessons.** Until the bike arrives, do indoor spin/stationary-bike sessions as a bridge. Do a Friel 30-min run test to confirm the VDOT estimate. Start strength work. If the bike or fit slips past Prep, Base starts anyway and the bike stays in "bridge" mode. |
| Base | 24–13 | 23 Nov 2026 – 14 Feb 2027 | Aerobic endurance and skills. Add Z3 muscular endurance in mid-Base, then Z4 threshold intervals late in Base. Longest sessions come at the end of Base. |
| Build | 12–4 | 15 Feb – 18 Apr 2027 | Race-specific work: race-pace and brick sessions get more frequent |
| Peak | 3 | 19 – 25 Apr 2027 | Race simulation, rest increases |
| Taper | 2–1 | 26 Apr – 9 May 2027 | See 7.4 |

- `buildPhases(raceDate, today, recoveryBlockWeeks)` is a pure function. If there are fewer weeks than ideal, shrink **Prep first, then Base**, and never cut the taper. That priority order is a project default.
- **Recovery weeks:** the last week of every block (3- or 4-week blocks) uses short, low-intensity sessions for 3–6 days ([Friel: Base 2 & 3][friel-base]). The volume reduction % is `project default, tune`.
- **Specificity rises toward the race:** "the closer in time you get to the race, the more like the race your workouts must become" ([Friel K.I.S.S.][friel-kiss]). Strength work drops to maintenance in mid-Base and to about once a week in late Base ([Friel: Base 2 & 3][friel-base]).

### 7.3 Intensity distribution
- About 80% of sessions are below the first threshold (easy). Use about two high-intensity sessions per week; more doesn't add much and raises stress ([Seiler & Tønnessen 2009][seiler]). For a triathlete the app treats "~2 hard sessions/week" as **total across sports**. That is a project interpretation.
- Seiler also notes that recreational athletes tend to drift into a threshold "black hole". The app flags weeks where too many logged sessions land in Z3/Z4.
- No anaerobic or VO2 work in Base 1. Base is "training to train" ([Friel: Base 2 & 3][friel-base]).
- **Base 2:** Z3 muscular endurance, e.g. 2×20 min (5-min recoveries) or 3×12 min (3-min recoveries). **Base 3:** Z4 intervals of 6–12 min with recoveries about 25% of the work time, building to 20–40 min of cumulative threshold work per sport per week ([Friel: Base 2 & 3][friel-base]).

### 7.4 Taper
- Taper for 2 weeks, cutting volume progressively (exponentially) by 41–60%. **Keep intensity and frequency the same** ([Bosquet et al. 2007 meta-analysis][bosquet]).

### 7.5 Priorities for this athlete (novice swim/bike, strong run)
- **Swim: priority 1.** The 1:10 swim cut-off is the first thing that can end the race, so swim skill gets the most frequent sessions. Many short, frequent swims suit skill learning better than a few long ones. That's a project default; the coach's advice wins.
- **Bike: priority 2.** Safety and handling first, then aerobic volume. The 5:30 swim + T1 + bike cut-off is the second hard limit. The app tracks the minimum bike speed (§4.3).
- **Run: maintenance.** 2–3 runs per week (project default): one easy-aerobic, one shorter quality run (Friel zones from §3.1), and a long run capped well below his marathon-training volume to free time and limit injury risk. From Build, most run "quality" becomes **brick runs** (short runs straight off the bike at goal race pace, about 5:27/km).
- Strength: maintenance, per the Friel phase rules in 7.2.

### 7.6 Weekly session generation
- Inputs: phase, week-in-block, `weeklyHoursAvailable`, rest days, long day.
- Output: 7 days, each holding 0–2 sessions with `{sport, type, durationMin, structure[], zoneTargets}`.
- The split of hours across sports, the long-session caps and the brick frequency by phase are all `project default, tune`. Keep them in constants and test them. A brick is a bike followed straight away by a run, and appears from Build onward.
- Invariants (all tested): hours within ±X% of the target (project default); no sessions on rest days; at most the Seiler-derived number of hard sessions; recovery weeks have no Z4+ work; taper keeps its frequency.

### 7.7 Adaptation (simple, explicit, tested)
- A new threshold test recalculates zones and future targets (7.1).
- A missed key session is **not** stacked onto the next day. It is either dropped or swapped with an easy day that week (project default).
- If weekly compliance is below a threshold (project default), the next load week repeats instead of progressing.
- A predicted finish later than 6:00 flags the weakest leg in the progress view and shows the tier that *is* on track.
- A skill checkpoint missed by its target date pushes later checkpoints back and raises a warning if S6 or B7 (below) would land after Peak week.

### 7.8 Skill tracks (novice mode)
While a discipline is in `skill` status, sessions have **checkpoint goals plus easy RPE targets, never zone targets**. Target dates are project defaults. Moving them is fine; the app re-plans.

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

## 8. Heat, hydration & fuelling

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

## 9. Milestones: one Cursor chat each

Each milestone is a small, self-contained agent task. **Definition of done for every milestone:** `npm test`, `npx tsc --noEmit` and `npm run lint` all pass, the acceptance check passes, and you've made a commit.

| # | Task | Acceptance check |
|---|---|---|
| M0 | Scaffold Next.js + TS strict + Vitest + ESLint + Prisma (SQLite). Add `npm test` and `typecheck` scripts. Copy the `seed/` folder. | `npm test` runs 1 sample test green, `npm run dev` serves a page, and `tsc` is clean |
| M1 | **TDD:** `time.ts`: parse/format `h:mm:ss`, convert pace↔speed, sec/100 m, sec/km. | Tests for edge cases (0, >1 h, rounding) were written first and committed, then turned green |
| M2 | **TDD:** `constants.ts` + `zones.ts`: Coggan power zones, Friel run pace zones, HR zones, CSS from 400/200, swim CSS±offset zones. Return "test needed" when a threshold is `null`. | Coggan FTP 250 W gives Z2 140–188 W (56–75%). CSS 400 m 6:00 / 200 m 3:00 gives 90 s/100 m (TrainingPeaks worked example). `null` FTP returns `{ok:false, error:'test-needed'}`. Every constant has a SOURCE comment. |
| M3 | **TDD:** `vdot.ts`: `estimateRunThresholdFromRace(distanceM, timeSec)` by interpolating the Daniels VDOT table rows (stored as sourced constants). | HM 1:39:00 gives VDOT ≈45.7 and T ≈ 275 s/km (±3). M 3:49:00 gives VDOT ≈40 and T ≈ 306 s/km. Result is flagged `estimated: true`. Out-of-table inputs return an error. |
| M4 | **TDD:** `pacing.ts`: goal tier to splits (the §4.2 default), splits to per-leg pace and speed, cut-off validation, minimum bike speed for the 5:30 cut-off. | §4.2 reproduced: total 5:56:00, bike 30.0 km/h, run ≈5:27/km. Min bike speed after a 57-min swim + T1 ≈19.8 km/h. A split that breaks a cut-off returns an error. |
| M5 | **TDD:** `heat.ts`: `adjustRunPaceForHeat`, with a warning flag above 25 °C WBGT. | 0% at 10 °C, +3.2% at 15 °C, and `warning: 'extrapolated'` at 28 °C |
| M6 | **TDD:** `phases.ts`: `buildPhases(raceDate, today, blockWeeks)`. | For 2027-05-09 / 2026-11-10 it reproduces the §7.2 dates. With fewer weeks it shrinks Prep then Base, and the taper is always 2 weeks. |
| M7 | **TDD:** `skills.ts`: swim and bike checkpoint tracks (§7.8), target dates, slip propagation, the "test now possible" trigger, and equipment gating (`hasBike:false` gives bridge sessions only). | S3 ticked → CSS test prompt. B5 ticked → FTP test prompt. `hasBike:false` never yields an outdoor ride. A late checkpoint that pushes S6/B7 past Peak raises a warning. The open-water checklist is always attached. |
| M8 | **TDD:** `sessions.ts`: weekly generator and invariants (§7.5–7.6). Skill-status disciplines get checkpoint sessions; zone-status ones get zone sessions. | Property-style tests over every week: rest days empty, hard sessions ≤ limit, no Z4+ in recovery or Base 1 weeks, no zone targets for `skill` disciplines, run sessions ≤ the run cap, swim frequency ≥ the other sports in Base, taper volume down 41–60% with frequency kept |
| M9 | `fuel.ts` (**TDD**) + Prisma schema + seed from `seed/athlete-profile.json`. | Planner warns on >2% loss and on overdrinking. `npx prisma db seed` loads the Da Nang defaults, equipment status and race results. |
| M10 | UI: profile (equipment, discipline status, race results, tests) and "Today" / "This week" views. | In the integrated browser: mark `hasBike` true, and outdoor bike sessions appear. Enter an FTP, and bike switches to zones. No console errors. |
| M11 | Workout log, checkpoint ticking, `adapt.ts` (**TDD**, §7.7). | Logging a new FTP changes future targets. A missed key session isn't stacked. A missed checkpoint date re-plans. |
| M12 | Progress view + race-day page (goal tiers, splits, min bike speed, heat-adjusted run pace, fuel plan per aid station). | Planned vs done and checkpoint charts render. The on-track tier and the weakest leg are shown. |
| M13 | Review pass: Agent Review on the branch, fix the issues it finds, add regression tests, update the rules. | Review findings resolved or recorded, and all checks green |

Data model (Prisma, M9):
```
Athlete(id, name, bodyMassKg, sweatRateLPerH, weeklyHoursAvailable, restDays Json, longDay, recoveryBlockWeeks,
        hasBike, bikeFitDone, hasIndoorTrainer, hasClipless, swimStatus[SKILL|ZONES], bikeStatus[SKILL|ZONES], runStatus[SKILL|ZONES])
RaceResult(id, athleteId, date?, distanceM, timeSec, conditionsNote?)
SkillCheckpoint(id, athleteId, sport[SWIM|BIKE], code[S0..S6|B0..B7], description, targetDate, doneDate?)
Race(id, athleteId, name, date, swimM, bikeKm, runKm, startTimeLocal, aidStationsBikeKm Json, aidStationsRunKm Json, cutoffs Json)
Goal(id, raceId, tier[CUTOFFS|SUB_630|SUB_600], finishSec, swimSec, t1Sec, bikeSec, t2Sec, runSec, bufferSec)
FitnessTest(id, athleteId, date, kind[FTP|RUN_THRESHOLD|CSS|LTHR_BIKE|LTHR_RUN|SWEAT_RATE], value, estimated Boolean, source[FIELD_TEST|RACE_RESULT], rawJson)
PlannedSession(id, athleteId, date, phase, weekOut, sport[SWIM|BIKE|RUN|BRICK|STRENGTH], type, durationMin, structure Json, targets Json, isKey)
WorkoutLog(id, plannedSessionId?, date, sport, durationMin, distanceM?, avgPower?, avgPaceSec?, avgHr?, rpe, status[DONE|PARTIAL|MISSED], notes, heatExposure Boolean)
```

---

## 10. How to work with Cursor on this

These map the course practices from my study notes onto this build.

1. **Explore and plan before coding.** Start each milestone in **Plan Mode** (Shift+Tab). Paste the milestone row and `@PLAN.md`. Answer its clarifying questions and trim the plan to that milestone only, then click Build.
2. **One milestone per chat.** Start a new chat when you switch milestones or when the agent starts going in circles. Reference the earlier chat rather than continuing it. This keeps context small, the answers focused and token costs down.
3. **Be specific; tag files.** Use `@PLAN.md`, `@src/lib/training/constants.ts` and the relevant test file. Name the function signature you want and point to an existing file as the pattern to follow.
4. **TDD for every `lib/training` function.** Say "this is TDD, don't mock code that doesn't exist yet". Have it write the tests from the input/output examples in §9, confirm they **fail**, and **commit the tests**. Then ask it to make them pass *without changing the tests*.
5. **Verification gives the agent feedback.** Tests, `tsc` and ESLint run on every milestone. Use the integrated browser for UI milestones (M8–M10) to check rendering and console errors.
6. **Watch the diff and stop scope creep.** If it touches files outside the milestone, stop it (Cmd/Ctrl+Shift+Backspace). If the build misses, **revert, make the plan more specific and rerun it**. Don't pile on patch prompts.
7. **Small semantic commits.** Commit after tests are written, then after they pass. One logical change per commit.
8. **Bugs:** for clear errors, paste the stack trace plus when it happens. For tricky ones (e.g. week boundaries in `buildPhases` or checkpoint slip logic), use **Debug Mode**: form a hypothesis, add logging, reproduce, then make a targeted fix. Always add a regression test. Don't accept a fix you don't understand, such as a null check that hides bad data.
9. **Start with the logic, not the UI.** M7 (skills) and M8 (sessions) are what make the app useful for *this* athlete, so give them their own chats and lean on their tests.
10. **Treat training numbers with suspicion.** The agent may invent plausible zone percentages. Every constant must carry a SOURCE comment. If it can't cite one, it must say `project default, tune`.
11. **Rules, kept few.** `.cursor/rules/*.mdc` (see below) plus `AGENTS.md`. When the agent repeats a mistake, add one short line to a rule, the way the course's "Step 5: write a rule" suggests.
12. **Review before calling it done.** Run Agent Review / "what would a reviewer flag?" at the end of each UI milestone and at M13.
13. **Costs.** Long chats resend all their context, and output tokens cost more than input. Keep chats short, ask for concise answers, and don't paste whole files when `@`-tagging will do.

---

## 11. Sources (all fetched 10 Nov 2026)

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
