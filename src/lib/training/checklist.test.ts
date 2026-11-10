import { describe, expect, it } from "vitest";
import { buildRaceWeekChecklist } from "./checklist";

describe("checklist.ts — race-week packing list", () => {
  it("includes no-wetsuit note, heat kit, fuel and transition bags for Da Nang", () => {
    const items = buildRaceWeekChecklist({
      raceName: "IRONMAN 70.3 Da Nang",
      wetsuitLikely: false,
      expectedWaterTempC: 29,
      airTempHighC: 34,
      bikeAidStationsKm: [19, 37, 46, 64, 79.5],
      carbGPerH: 60,
      fluidLPerH: 0.6,
    });

    const texts = items.map((i) => i.text);
    expect(texts.some((t) => /no wetsuit|without a wetsuit/i.test(t))).toBe(true);
    expect(texts.some((t) => /heat|ice|sunscreen|cap/i.test(t))).toBe(true);
    expect(texts.some((t) => /transition/i.test(t))).toBe(true);
    expect(texts.some((t) => /fuel|carb|gel/i.test(t))).toBe(true);
    expect(items.every((i) => i.kind === "RACE_WEEK" || i.kind === "PACKING")).toBe(
      true
    );
    expect(items.every((i) => i.id.length > 0 && i.done === false)).toBe(true);
  });
});
