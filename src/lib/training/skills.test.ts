import { describe, expect, it } from "vitest";
import {
  OPEN_WATER_SAFETY_CHECKLIST,
  buildSkillTracks,
  getNextTestPrompt,
  planBikeSessionMode,
  tickCheckpoint,
} from "./skills";

describe("skills.ts — tracks and test prompts", () => {
  it("builds swim and bike tracks with PLAN.md §7.8 target dates", () => {
    const tracks = buildSkillTracks({
      today: "2026-11-10",
      prepEndDate: "2026-11-22",
      peakStartDate: "2027-04-19",
      buildStartDate: "2027-02-15",
    });
    expect(tracks.swim.map((c) => c.code)).toEqual([
      "S0",
      "S1",
      "S2",
      "S3",
      "S4",
      "S5",
      "S6",
    ]);
    expect(tracks.bike.map((c) => c.code)).toEqual([
      "B0",
      "B1",
      "B2",
      "B3",
      "B4",
      "B5",
      "B6",
      "B7",
    ]);
    expect(tracks.swim.find((c) => c.code === "S0")?.targetDate).toBe(
      "2026-11-22"
    );
    expect(tracks.swim.find((c) => c.code === "S3")?.targetDate).toBe(
      "2027-01-15"
    );
    expect(tracks.swim.find((c) => c.code === "S6")?.targetDate).toBe(
      "2027-04-19"
    );
    expect(tracks.bike.find((c) => c.code === "B5")?.targetDate).toBe(
      "2027-02-15"
    );
    expect(tracks.bike.find((c) => c.code === "B7")?.targetDate).toBe(
      "2027-04-19"
    );
  });

  it("prompts CSS test after S3 is ticked, FTP after B5", () => {
    const tracks = buildSkillTracks({
      today: "2026-11-10",
      prepEndDate: "2026-11-22",
      peakStartDate: "2027-04-19",
      buildStartDate: "2027-02-15",
    });
    const afterS3 = tickCheckpoint(tracks, "S3", "2027-01-15");
    expect(afterS3.ok).toBe(true);
    if (!afterS3.ok) return;
    expect(getNextTestPrompt(afterS3.value)).toEqual({
      ok: true,
      value: { kind: "CSS", checkpoint: "S3" },
    });

    const afterB5 = tickCheckpoint(tracks, "B5", "2027-02-10");
    expect(afterB5.ok).toBe(true);
    if (!afterB5.ok) return;
    expect(getNextTestPrompt(afterB5.value)).toEqual({
      ok: true,
      value: { kind: "FTP", checkpoint: "B5" },
    });
  });

  it("propagates slip and warns when S6/B7 would land after Peak", () => {
    const tracks = buildSkillTracks({
      today: "2026-11-10",
      prepEndDate: "2026-11-22",
      peakStartDate: "2027-04-19",
      buildStartDate: "2027-02-15",
    });
    // Miss S4 by a long way so later targets push past Peak
    const slipped = tickCheckpoint(tracks, "S4", "2027-04-01", {
      peakStartDate: "2027-04-19",
    });
    expect(slipped.ok).toBe(true);
    if (!slipped.ok) return;
    const s5 = slipped.value.swim.find((c) => c.code === "S5");
    const s6 = slipped.value.swim.find((c) => c.code === "S6");
    expect(s5?.targetDate && s5.targetDate > "2027-03-31").toBe(true);
    expect(s6?.targetDate && s6.targetDate > "2027-04-19").toBe(true);
    expect(slipped.value.warning).toBe("checkpoint-past-peak");
  });
});

describe("skills.ts — equipment gating and open-water safety", () => {
  it("never plans outdoor rides when hasBike is false", () => {
    expect(planBikeSessionMode({ hasBike: false })).toEqual({
      mode: "indoor-bridge",
      outdoorAllowed: false,
    });
    expect(planBikeSessionMode({ hasBike: true, bikeFitDone: false })).toEqual({
      mode: "indoor",
      outdoorAllowed: false,
    });
    expect(
      planBikeSessionMode({
        hasBike: true,
        bikeFitDone: true,
        checkpointB1Done: true,
      })
    ).toEqual({
      mode: "outdoor-allowed",
      outdoorAllowed: true,
    });
  });

  it("always attaches the open-water safety checklist", () => {
    expect(OPEN_WATER_SAFETY_CHECKLIST).toEqual([
      "buddy",
      "bright-cap",
      "tow-float",
      "conditions-checked",
    ]);
    const tracks = buildSkillTracks({
      today: "2026-11-10",
      prepEndDate: "2026-11-22",
      peakStartDate: "2027-04-19",
      buildStartDate: "2027-02-15",
    });
    for (const code of ["S4", "S5", "S6"] as const) {
      const cp = tracks.swim.find((c) => c.code === code);
      expect(cp?.openWaterChecklist).toEqual(OPEN_WATER_SAFETY_CHECKLIST);
      expect(cp?.soloAllowed).toBe(false);
    }
  });
});
