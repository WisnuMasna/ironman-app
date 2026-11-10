import { FitnessTestKind } from "@prisma/client";
import { Suspense } from "react";
import { latestTestValue } from "@/lib/db/athlete";
import { loadWeekPlan } from "@/lib/db/plan";
import { formatDurationHms, formatPaceMinPerKm } from "@/lib/training/time";
import { buildCogganPowerZones } from "@/lib/training/zones";
import { saveEquipment, saveFtp } from "../actions";
import { requestNow } from "../request-now";

export default function ProfilePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading profile…</p>}>
        <ProfileContent />
      </Suspense>
    </main>
  );
}

async function ProfileContent() {
  const plan = await loadWeekPlan(await requestNow());
  if (plan === null) {
    return <p>No athlete seeded. Run `npx prisma db seed`.</p>;
  }

  const { athlete } = plan;
  const ftp = latestTestValue(athlete.fitnessTests, FitnessTestKind.FTP);
  const css = latestTestValue(athlete.fitnessTests, FitnessTestKind.CSS);
  const runThreshold = latestTestValue(
    athlete.fitnessTests,
    FitnessTestKind.RUN_THRESHOLD
  );
  const powerZones = ftp ? buildCogganPowerZones(ftp.value) : null;

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-lg font-medium">{athlete.name}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Race {plan.raceDate} · swim {athlete.swimStatus.toLowerCase()} · bike{" "}
          {athlete.bikeStatus.toLowerCase()} · run {athlete.runStatus.toLowerCase()}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Equipment</h2>
        <form action={saveEquipment} className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="hasBike" defaultChecked={athlete.hasBike} />
            Has bike
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="bikeFitDone"
              defaultChecked={athlete.bikeFitDone}
            />
            Bike fit done
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="hasIndoorTrainer"
              defaultChecked={athlete.hasIndoorTrainer}
            />
            Indoor trainer
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="hasClipless"
              defaultChecked={athlete.hasClipless}
            />
            Clipless pedals
          </label>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Save equipment
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Fitness tests</h2>
        <ul className="space-y-1 text-sm">
          <li>
            FTP:{" "}
            {ftp ? `${ftp.value} W` : <span className="text-amber-700">test needed</span>}
          </li>
          <li>
            CSS:{" "}
            {css ? (
              `${css.value} s/100m`
            ) : (
              <span className="text-amber-700">test needed</span>
            )}
          </li>
          <li>
            Run threshold:{" "}
            {runThreshold ? (
              <>
                {formatPaceMinPerKm(runThreshold.value)}
                {runThreshold.estimated ? " (estimated)" : ""}
              </>
            ) : (
              <span className="text-amber-700">test needed</span>
            )}
          </li>
        </ul>

        <form action={saveFtp} className="flex flex-wrap items-end gap-2 text-sm">
          <label className="flex flex-col gap-1">
            FTP (watts)
            <input
              type="number"
              name="ftpWatts"
              min={1}
              step={1}
              required
              className="rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Save FTP
          </button>
        </form>
        {powerZones?.ok ? (
          <p className="text-xs text-zinc-500">
            Coggan Z2: {powerZones.value.find((z) => z.zone === "Z2")?.minWatts}–
            {powerZones.value.find((z) => z.zone === "Z2")?.maxWatts} W
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Race results</h2>
        <ul className="space-y-1 text-sm">
          {athlete.raceResults.map((result) => (
            <li key={result.id}>
              {result.label ?? `${result.distanceM} m`}:{" "}
              {formatDurationHms(result.timeSec)}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
