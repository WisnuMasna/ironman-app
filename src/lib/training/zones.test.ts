import { describe, expect, it } from "vitest";
import {
  buildCogganPowerZones,
  buildFrielBikeHrZones,
  buildFrielRunHrZones,
  buildFrielRunPaceZones,
  buildSwimCssZones,
  computeCssSecPer100m,
} from "./zones";

describe("zones.ts — Coggan power zones", () => {
  it("builds Z2 140–188 W for FTP 250 W (56–75%)", () => {
    const res = buildCogganPowerZones(250);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const z2 = res.value.find((z) => z.zone === "Z2");
    expect(z2).toEqual({
      zone: "Z2",
      label: "Endurance",
      minWatts: 140,
      maxWatts: 188,
    });
  });

  it("covers Z1–Z7 with expected % FTP bounds for FTP 250", () => {
    const res = buildCogganPowerZones(250);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.map((z) => z.zone)).toEqual([
      "Z1",
      "Z2",
      "Z3",
      "Z4",
      "Z5",
      "Z6",
      "Z7",
    ]);
    expect(res.value.find((z) => z.zone === "Z1")).toMatchObject({
      minWatts: 0,
      maxWatts: 138, // 55% of 250
    });
    expect(res.value.find((z) => z.zone === "Z3")).toMatchObject({
      minWatts: 190, // 76%
      maxWatts: 225, // 90%
    });
    expect(res.value.find((z) => z.zone === "Z4")).toMatchObject({
      minWatts: 228, // 91%
      maxWatts: 263, // 105%
    });
    expect(res.value.find((z) => z.zone === "Z7")).toMatchObject({
      minWatts: 376, // >150% → 151% of 250 rounded
      maxWatts: null,
    });
  });

  it("returns test-needed when FTP is null", () => {
    expect(buildCogganPowerZones(null)).toEqual({
      ok: false,
      error: "test-needed",
    });
  });

  it("rejects non-positive FTP", () => {
    expect(buildCogganPowerZones(0)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
    expect(buildCogganPowerZones(-10)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
  });
});

describe("zones.ts — Friel run pace zones", () => {
  it("builds zones from threshold pace 275 s/km (higher % = slower)", () => {
    const res = buildFrielRunPaceZones(275);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // Z4 99–105% of threshold pace
    const z4 = res.value.find((z) => z.zone === "Z4");
    expect(z4).toMatchObject({
      zone: "Z4",
      minPaceSecPerKm: Math.round(275 * 0.99),
      maxPaceSecPerKm: Math.round(275 * 1.05),
    });
    // Z1 is slower than 129% (min = ceil of 129%+epsilon → open-ended slow)
    const z1 = res.value.find((z) => z.zone === "Z1");
    expect(z1).toMatchObject({
      minPaceSecPerKm: Math.round(275 * 1.29) + 1,
      maxPaceSecPerKm: null,
    });
    // Z5c is faster than 90% (max open on the fast side)
    const z5c = res.value.find((z) => z.zone === "Z5c");
    expect(z5c).toMatchObject({
      minPaceSecPerKm: null,
      maxPaceSecPerKm: Math.round(275 * 0.9) - 1,
    });
  });

  it("returns test-needed when threshold pace is null", () => {
    expect(buildFrielRunPaceZones(null)).toEqual({
      ok: false,
      error: "test-needed",
    });
  });
});

describe("zones.ts — Friel HR zones", () => {
  it("builds run HR zones from LTHR 170", () => {
    const res = buildFrielRunHrZones(170);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.find((z) => z.zone === "Z2")).toMatchObject({
      minHr: Math.round(170 * 0.85),
      maxHr: Math.round(170 * 0.89),
    });
    expect(res.value.find((z) => z.zone === "Z5a")).toMatchObject({
      minHr: Math.round(170 * 1.0),
      maxHr: Math.round(170 * 1.02),
    });
  });

  it("builds bike HR zones from LTHR 160 with bike-specific %", () => {
    const res = buildFrielBikeHrZones(160);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // Bike Z1 <81%, Z2 81–89%
    expect(res.value.find((z) => z.zone === "Z1")).toMatchObject({
      minHr: 0,
      maxHr: Math.round(160 * 0.81) - 1,
    });
    expect(res.value.find((z) => z.zone === "Z2")).toMatchObject({
      minHr: Math.round(160 * 0.81),
      maxHr: Math.round(160 * 0.89),
    });
  });

  it("returns test-needed when LTHR is null", () => {
    expect(buildFrielRunHrZones(null)).toEqual({
      ok: false,
      error: "test-needed",
    });
    expect(buildFrielBikeHrZones(null)).toEqual({
      ok: false,
      error: "test-needed",
    });
  });
});

describe("zones.ts — CSS and swim zones", () => {
  it("computes CSS 90 s/100m from 400m 6:00 and 200m 3:00", () => {
    // TrainingPeaks worked example: (360 − 180) / 2 = 90
    expect(computeCssSecPer100m(360, 180)).toEqual({ ok: true, value: 90 });
  });

  it("rejects invalid CSS test times", () => {
    expect(computeCssSecPer100m(180, 360)).toEqual({
      ok: false,
      error: "invalid-input",
    });
    expect(computeCssSecPer100m(0, 180)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
    expect(computeCssSecPer100m(null, 180)).toEqual({
      ok: false,
      error: "test-needed",
    });
    expect(computeCssSecPer100m(360, null)).toEqual({
      ok: false,
      error: "test-needed",
    });
  });

  it("builds swim zones as CSS ± offset seconds", () => {
    const res = buildSwimCssZones(90);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // Easy / aerobic is CSS + positive offset (slower)
    const easy = res.value.find((z) => z.zone === "Z2");
    expect(easy?.minPaceSecPer100m).toBeGreaterThan(90);
    // Threshold near CSS
    const threshold = res.value.find((z) => z.zone === "Z4");
    expect(threshold).toBeDefined();
    expect(threshold?.minPaceSecPer100m).toBeLessThanOrEqual(90);
    expect(threshold?.maxPaceSecPer100m).toBeGreaterThanOrEqual(90);
  });

  it("returns test-needed when CSS is null", () => {
    expect(buildSwimCssZones(null)).toEqual({
      ok: false,
      error: "test-needed",
    });
  });
});
