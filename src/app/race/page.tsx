import { Suspense } from "react";
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
import { FitnessTestKind } from "@prisma/client";
import { ChecklistClient } from "../ui/checklist";

export default function RacePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Race day</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading race plan…</p>}>
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
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-lg font-medium">{race.name}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {race.date} · start {race.startTimeLocal} · swim cut-off{" "}
          {formatDurationHms(CUTOFF_SWIM_SEC)}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Stretch splits (sub-6)</h2>
        {metrics.ok ? (
          <ul className="space-y-1 text-sm">
            <li>
              Swim {formatDurationHms(splits.swimSec)} ·{" "}
              {formatPacePer100m(metrics.value.swimPaceSecPer100m)}
            </li>
            <li>T1 {formatDurationHms(splits.t1Sec)}</li>
            <li>
              Bike {formatDurationHms(splits.bikeSec)} ·{" "}
              {metrics.value.bikeSpeedKph.toFixed(1)} km/h
            </li>
            <li>T2 {formatDurationHms(splits.t2Sec)}</li>
            <li>
              Run {formatDurationHms(splits.runSec)} ·{" "}
              {formatPaceMinPerKm(metrics.value.runPaceSecPerKm)}
            </li>
            <li className="font-medium">
              Total {formatDurationHms(metrics.value.totalSec)}
              {cutoffs.ok ? " · inside cut-offs" : ` · ${cutoffs.error}`}
            </li>
          </ul>
        ) : (
          <p className="text-sm">Could not compute leg metrics.</p>
        )}
        {minBike.ok ? (
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Minimum bike average to hold the 5:30 swim+T1+bike cut-off:{" "}
            {minBike.value.toFixed(1)} km/h
          </p>
        ) : null}
        {heat.ok ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Heat-adjusted run at WBGT 28 °C:{" "}
            {formatPaceMinPerKm(heat.value.adjustedPaceSecPerKm)}
            {heat.value.warning === "extrapolated"
              ? " (extrapolated — above studied range)"
              : ""}
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Bike fuel plan</h2>
        {fuel.ok ? (
          <>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Per hour: {fuel.value.perHour.carbG} g carb ·{" "}
              {fuel.value.perHour.fluidL.toFixed(2)} L ·{" "}
              {Math.round(fuel.value.perHour.sodiumMg)} mg sodium
            </p>
            {fuel.value.warnings.length > 0 ? (
              <p className="text-sm text-amber-700">
                Warnings: {fuel.value.warnings.join(", ")}
              </p>
            ) : null}
            <ul className="space-y-1 text-sm">
              {fuel.value.aidStations.map((aid) => (
                <li key={aid.km}>
                  km {aid.km}: {aid.carbG} g · {aid.fluidL.toFixed(2)} L ·{" "}
                  {Math.round(aid.sodiumMg)} mg Na
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Fuel plan needs body mass and sweat rate
            {sweat === null ? " (test needed)" : ""}. Enter them on Profile when
            you have numbers.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Checklist & packing</h2>
        <ChecklistClient items={checklist} />
      </section>
    </div>
  );
}
