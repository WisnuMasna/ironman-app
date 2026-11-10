import { Suspense } from "react";
import { FitnessTestKind } from "@prisma/client";
import { ChecklistClient } from "../ui/checklist";
import { getAthlete, latestTestValue } from "@/lib/db/athlete";
import { buildRaceWeekChecklist } from "@/lib/training/checklist";
import {
  CARB_G_PER_H_LONG_MAX,
  CARB_G_PER_H_LONG_MIN,
  CUTOFF_SWIM_SEC,
  CUTOFF_SWIM_T1_BIKE_SEC,
  RACE_BIKE_M,
} from "@/lib/training/constants";
import { planFuelAndFluid } from "@/lib/training/fuel";
import { adjustRunPaceForHeat } from "@/lib/training/heat";
import {
  computeLegMetrics,
  computeMinBikeSpeedKph,
  getDefaultSub600Splits,
  validateSplitsAgainstCutoffs,
} from "@/lib/training/pacing";
import {
  formatDurationHms,
  formatPaceMinPerKm,
  formatPacePer100m,
} from "@/lib/training/time";

export default function RacePage() {
  return (
    <main className="screen">
      <Suspense fallback={<p className="text-sm text-muted">Loading races…</p>}>
        <RaceContent />
      </Suspense>
    </main>
  );
}

async function RaceContent() {
  const athlete = await getAthlete();
  if (athlete === null || athlete.races.length === 0) {
    return <p>No athlete seeded. Run `npx prisma db seed`.</p>;
  }

  const race = athlete.races[0];
  const splits = getDefaultSub600Splits();
  const metrics = computeLegMetrics(splits);
  const cutoffs = validateSplitsAgainstCutoffs(splits);
  const minBike = computeMinBikeSpeedKph({
    swimPlusT1Sec: splits.swimSec + splits.t1Sec,
    swimT1BikeCutoffSec: CUTOFF_SWIM_T1_BIKE_SEC,
    bikeDistanceM: RACE_BIKE_M,
  });

  const aidStations = Array.isArray(race.aidStationsBikeKm)
    ? (race.aidStationsBikeKm as number[])
    : [];

  const carbGPerH = (CARB_G_PER_H_LONG_MIN + CARB_G_PER_H_LONG_MAX) / 2;
  const fluidLPerH = 0.6;
  const fuel = planFuelAndFluid({
    bodyMassKg: athlete.bodyMassKg,
    sweatRateLPerH: athlete.sweatRateLPerH,
    fluidIntakeLPerH: fluidLPerH,
    carbGPerH,
    legDistanceKm: race.bikeKm,
    legDurationSec: splits.bikeSec,
    aidStationsKm: aidStations,
  });

  const heat = adjustRunPaceForHeat(
    metrics.ok ? metrics.value.runPaceSecPerKm : 327,
    28
  );

  const checklist = buildRaceWeekChecklist({
    raceName: race.name,
    wetsuitLikely: false,
    expectedWaterTempC: 29,
    airTempHighC: 34,
    bikeAidStationsKm: aidStations,
    carbGPerH,
    fluidLPerH,
  });

  const sweat = latestTestValue(athlete.fitnessTests, FitnessTestKind.SWEAT_RATE);

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-h1 font-extrabold">Races</h1>
        <p className="text-sm text-muted">A race, cut-offs, fuel and packing</p>
      </header>

      <section className="rounded-lg bg-surface p-4 shadow-1">
        <p className="text-overline font-bold tracking-[0.08em] text-faint uppercase">
          A race · 70.3
        </p>
        <h2 className="mt-1 text-h2 font-extrabold">{race.name}</h2>
        <p className="text-sm text-muted">
          {race.date} · start {race.startTimeLocal} · swim cut-off{" "}
          {formatDurationHms(CUTOFF_SWIM_SEC)}
        </p>
      </section>

      <section className="space-y-3 rounded-lg bg-surface p-4 shadow-1">
        <h2 className="text-h3 font-bold">Stretch splits (sub-6)</h2>
        {metrics.ok ? (
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between gap-3">
              <span className="text-swim-ink font-bold">Swim</span>
              <span className="font-numeric">
                {formatDurationHms(splits.swimSec)} ·{" "}
                {formatPacePer100m(metrics.value.swimPaceSecPer100m)}
              </span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-muted">T1</span>
              <span className="font-numeric">{formatDurationHms(splits.t1Sec)}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-bike-ink font-bold">Bike</span>
              <span className="font-numeric">
                {formatDurationHms(splits.bikeSec)} ·{" "}
                {metrics.value.bikeSpeedKph.toFixed(1)} km/h
              </span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-muted">T2</span>
              <span className="font-numeric">{formatDurationHms(splits.t2Sec)}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-run-ink font-bold">Run</span>
              <span className="font-numeric">
                {formatDurationHms(splits.runSec)} ·{" "}
                {formatPaceMinPerKm(metrics.value.runPaceSecPerKm)}
              </span>
            </li>
            <li className="flex justify-between gap-3 border-t border-border pt-2 font-bold">
              <span>Total</span>
              <span className="font-numeric">
                {formatDurationHms(metrics.value.totalSec)}
                {cutoffs.ok ? " · inside cut-offs" : ` · ${cutoffs.error}`}
              </span>
            </li>
          </ul>
        ) : (
          <p className="text-sm">Could not compute leg metrics.</p>
        )}
        {minBike.ok ? (
          <p className="rounded-md bg-warning-soft px-3 py-2 text-sm text-warning">
            Minimum bike average for the 5:30 swim+T1+bike cut-off:{" "}
            <span className="font-numeric font-bold">{minBike.value.toFixed(1)} km/h</span>
          </p>
        ) : null}
        {heat.ok ? (
          <div className="rounded-md bg-heat-soft px-3 py-2 text-sm text-heat">
            Heat-adjusted run at WBGT 28 °C:{" "}
            <span className="font-numeric font-bold">
              {formatPaceMinPerKm(heat.value.adjustedPaceSecPerKm)}
            </span>
            {heat.value.warning === "extrapolated"
              ? " (extrapolated — above studied range)"
              : ""}
          </div>
        ) : null}
      </section>

      <section className="space-y-3 rounded-lg bg-surface p-4 shadow-1">
        <h2 className="text-h3 font-bold">Bike fuel plan</h2>
        {fuel.ok ? (
          <>
            <p className="text-sm text-muted">
              Per hour: {fuel.value.perHour.carbG} g carb ·{" "}
              {fuel.value.perHour.fluidL.toFixed(2)} L ·{" "}
              {Math.round(fuel.value.perHour.sodiumMg)} mg sodium
            </p>
            {fuel.value.warnings.length > 0 ? (
              <p className="text-sm text-warning">
                Warnings: {fuel.value.warnings.join(", ")}
              </p>
            ) : null}
            <ul className="space-y-1 text-sm">
              {fuel.value.aidStations.map((aid) => (
                <li key={aid.km} className="flex justify-between gap-3">
                  <span>km {aid.km}</span>
                  <span className="font-numeric text-muted">
                    {aid.carbG} g · {aid.fluidL.toFixed(2)} L ·{" "}
                    {Math.round(aid.sodiumMg)} mg Na
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted">
            Fuel plan needs body mass and sweat rate
            {sweat === null ? " (test needed)" : ""}. Enter them in Settings when
            you have numbers.
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-lg bg-surface p-4 shadow-1">
        <h2 className="text-h3 font-bold">Checklist & packing</h2>
        <ChecklistClient items={checklist} />
      </section>
    </>
  );
}
