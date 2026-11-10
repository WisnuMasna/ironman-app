import { FitnessTestKind } from "@prisma/client";
import { Suspense } from "react";
import { latestTestValue } from "@/lib/db/athlete";
import { loadWeekPlan } from "@/lib/db/plan";
import { tracksFromDb } from "@/lib/db/tracks";
import { getNextTestPrompt } from "@/lib/training/skills";
import { formatDurationHms, formatPaceMinPerKm } from "@/lib/training/time";
import { buildCogganPowerZones } from "@/lib/training/zones";
import { WarningBanner } from "@/components/ui/warning-banner";
import { markCheckpointDone, saveEquipment, saveFtp } from "../actions";
import { requestNow } from "../request-now";

export default function ProfilePage() {
  return (
    <main className="screen">
      <Suspense fallback={<p className="text-sm text-muted">Loading settings…</p>}>
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
  const testPrompt = getNextTestPrompt(tracksFromDb(athlete.skillCheckpoints));

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-h1 font-extrabold">Settings</h1>
        <p className="text-sm text-muted">
          {athlete.name} · race {plan.raceDate} · swim {athlete.swimStatus.toLowerCase()} ·
          bike {athlete.bikeStatus.toLowerCase()} · run {athlete.runStatus.toLowerCase()}
        </p>
      </header>

      <section className="space-y-3 rounded-lg bg-surface p-4 shadow-1">
        <h2 className="text-h3 font-bold">Equipment</h2>
        <form action={saveEquipment} className="space-y-3 text-sm">
          {(
            [
              ["hasBike", "Has bike", athlete.hasBike],
              ["bikeFitDone", "Bike fit done", athlete.bikeFitDone],
              ["hasIndoorTrainer", "Indoor trainer", athlete.hasIndoorTrainer],
              ["hasClipless", "Clipless pedals", athlete.hasClipless],
            ] as const
          ).map(([name, label, checked]) => (
            <label
              key={name}
              className="flex min-h-tap items-center justify-between gap-3 rounded-md bg-surface-2 px-3"
            >
              <span className="font-bold">{label}</span>
              <input type="checkbox" name={name} defaultChecked={checked} className="h-5 w-5" />
            </label>
          ))}
          <button
            type="submit"
            className="flex min-h-tap w-full items-center justify-center rounded-pill bg-primary px-4 font-bold text-on-primary"
          >
            Save equipment
          </button>
        </form>
      </section>

      <section className="space-y-3 rounded-lg bg-surface p-4 shadow-1">
        <h2 className="text-h3 font-bold">Fitness tests</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between gap-3">
            <span>FTP</span>
            <span className="font-numeric font-bold">
              {ftp ? `${ftp.value} W` : <span className="text-warning">test needed</span>}
            </span>
          </li>
          <li className="flex justify-between gap-3">
            <span>CSS</span>
            <span className="font-numeric font-bold">
              {css ? `${css.value} s/100m` : <span className="text-warning">test needed</span>}
            </span>
          </li>
          <li className="flex justify-between gap-3">
            <span>Run threshold</span>
            <span className="font-numeric font-bold">
              {runThreshold ? (
                <>
                  {formatPaceMinPerKm(runThreshold.value)}
                  {runThreshold.estimated ? " (estimated)" : ""}
                </>
              ) : (
                <span className="text-warning">test needed</span>
              )}
            </span>
          </li>
        </ul>

        <form action={saveFtp} className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-[8rem] flex-1 flex-col gap-1 text-sm">
            <span className="text-caption font-bold text-faint">FTP (watts)</span>
            <input
              type="number"
              name="ftpWatts"
              min={1}
              step={1}
              required
              className="min-h-tap rounded-sm border border-border-strong bg-surface-2 px-3 font-numeric"
            />
          </label>
          <button
            type="submit"
            className="min-h-tap rounded-pill bg-primary px-4 font-bold text-on-primary"
          >
            Save FTP
          </button>
        </form>
        {powerZones?.ok ? (
          <p className="text-caption text-faint">
            Coggan Z2: {powerZones.value.find((z) => z.zone === "Z2")?.minWatts}–
            {powerZones.value.find((z) => z.zone === "Z2")?.maxWatts} W
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-bold">Skill checkpoints</h2>
        {testPrompt.ok ? (
          <WarningBanner
            variant="info"
            headline={`${testPrompt.value.kind} test possible`}
            body={`${testPrompt.value.checkpoint} is done — log the test when ready.`}
          />
        ) : null}
        <ul className="space-y-2">
          {athlete.skillCheckpoints.map((checkpoint) => (
            <li
              key={checkpoint.code}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface px-3 py-3 shadow-1"
            >
              <div className="min-w-0 text-sm">
                <p className="font-bold">
                  {checkpoint.code}{" "}
                  <span className="font-normal text-muted">{checkpoint.description}</span>
                </p>
                <p className="text-caption text-faint">
                  target {checkpoint.targetDate}
                  {checkpoint.doneDate !== null ? ` · done ${checkpoint.doneDate}` : ""}
                </p>
              </div>
              {checkpoint.doneDate === null ? (
                <form action={markCheckpointDone}>
                  <input type="hidden" name="code" value={checkpoint.code} />
                  <button
                    type="submit"
                    className="min-h-tap rounded-pill bg-surface-2 px-3 text-caption font-bold text-primary"
                  >
                    Mark done
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2 rounded-lg bg-surface p-4 shadow-1">
        <h2 className="text-h3 font-bold">Race results</h2>
        <ul className="space-y-1 text-sm">
          {athlete.raceResults.map((result) => (
            <li key={result.id} className="flex justify-between gap-3">
              <span>{result.label ?? `${result.distanceM} m`}</span>
              <span className="font-numeric font-bold">
                {formatDurationHms(result.timeSec)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
