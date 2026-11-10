import { listValidMoveSlots } from "../training/missed";
import type { WeekPlan } from "../training/sessions";

/** Empty-day move targets keyed by origin session date. */
export function moveSlotsByDate(week: WeekPlan): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const day of week.days) {
    result[day.date] = listValidMoveSlots(week, day.date);
  }
  return result;
}
