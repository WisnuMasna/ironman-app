export type ChecklistKind = "RACE_WEEK" | "PACKING";

export type ChecklistItem = {
  id: string;
  kind: ChecklistKind;
  text: string;
  done: boolean;
};

export type RaceChecklistInput = {
  raceName: string;
  wetsuitLikely: boolean;
  expectedWaterTempC: number | null;
  airTempHighC: number | null;
  bikeAidStationsKm: number[];
  carbGPerH: number;
  fluidLPerH: number;
};

function item(id: string, kind: ChecklistKind, text: string): ChecklistItem {
  return { id, kind, text, done: false };
}

/**
 * Race-week checklist and packing list from race type/conditions.
 * SOURCE: PLAN.md §6.2; Da Nang wetsuit rule from IRONMAN 2026 Competition Rules §4.02
 */
export function buildRaceWeekChecklist(
  input: RaceChecklistInput
): ChecklistItem[] {
  const water =
    input.expectedWaterTempC !== null
      ? `Expected water ~${input.expectedWaterTempC} °C.`
      : "Confirm water temperature on race morning.";
  const wetsuit = input.wetsuitLikely
    ? "Wetsuit likely legal — pack it and a spare cap."
    : `Plan to swim without a wetsuit. ${water} Official call is race morning.`;

  const heat =
    input.airTempHighC !== null
      ? `Heat kit for ~${input.airTempHighC} °C highs: light kit, sunscreen, ice/sponge plan, extra bottles.`
      : "Heat kit: light kit, sunscreen, ice/sponge plan, extra bottles.";

  const aid =
    input.bikeAidStationsKm.length > 0
      ? `Bike aid stations at km ${input.bikeAidStationsKm.join(", ")}.`
      : "Confirm bike aid-station kilometres in the athlete guide.";

  const fuel = `Race fuel: practise ~${input.carbGPerH} g carb/h and ~${input.fluidLPerH} L/h on long rides. Pack gels/chews to match.`;

  return [
    item("rw-wetsuit", "RACE_WEEK", wetsuit),
    item("rw-heat", "RACE_WEEK", heat),
    item("rw-fuel-practise", "RACE_WEEK", fuel),
    item("rw-aid", "RACE_WEEK", aid),
    item(
      "rw-cutoff",
      "RACE_WEEK",
      "Know cut-offs: swim 1:10, swim+T1+bike 5:30, total 8:30."
    ),
    item(
      "pk-t1",
      "PACKING",
      "Transition bag T1: helmet, bike shoes, sunglasses, nutrition on bike, sunscreen."
    ),
    item(
      "pk-t2",
      "PACKING",
      "Transition bag T2: run shoes, socks, race belt, hat/visor, run gels."
    ),
    item(
      "pk-swim",
      "PACKING",
      "Swim: bright cap, goggles (clear + tinted), anti-fog, body glide (no wetsuit)."
    ),
    item(
      "pk-special",
      "PACKING",
      "Special needs / personal fuel bag labelled; spare tube, CO₂, multi-tool."
    ),
    item(
      "pk-heat",
      "PACKING",
      "Race-morning heat: salt tabs if you use them, frozen bottle option, cooling towel."
    ),
  ];
}
