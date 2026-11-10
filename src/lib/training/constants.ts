// Coggan power levels (% FTP). SOURCE: TrainingPeaks Coggan levels,
// https://www.trainingpeaks.com/blog/power-training-levels/
export const COGGAN_POWER_ZONE_BOUNDS = [
  { zone: "Z1", label: "Active Recovery", minPctFtp: 0, maxPctFtp: 55 },
  { zone: "Z2", label: "Endurance", minPctFtp: 56, maxPctFtp: 75 },
  { zone: "Z3", label: "Tempo", minPctFtp: 76, maxPctFtp: 90 },
  { zone: "Z4", label: "Threshold", minPctFtp: 91, maxPctFtp: 105 },
  { zone: "Z5", label: "VO2max", minPctFtp: 106, maxPctFtp: 120 },
  { zone: "Z6", label: "Anaerobic", minPctFtp: 121, maxPctFtp: 150 },
  // Z7 is strictly >150% FTP; builder uses round(150%)+1 as the open lower bound.
  { zone: "Z7", label: "Neuromuscular", minPctFtp: 150, maxPctFtp: null },
] as const;

// Friel run pace zones (% of threshold pace; higher % = slower).
// SOURCE: Joe Friel Quick Guide to Setting Zones,
// https://www.trainingpeaks.com/learn/articles/joe-friel-s-quick-guide-to-setting-zones/
export const FRIEL_RUN_PACE_ZONE_BOUNDS = [
  { zone: "Z1", label: "Recovery", minPctThresholdPace: 129, maxPctThresholdPace: null },
  { zone: "Z2", label: "Aerobic", minPctThresholdPace: 114, maxPctThresholdPace: 129 },
  { zone: "Z3", label: "Tempo", minPctThresholdPace: 106, maxPctThresholdPace: 113 },
  { zone: "Z4", label: "SubThreshold", minPctThresholdPace: 99, maxPctThresholdPace: 105 },
  { zone: "Z5a", label: "SuperThreshold", minPctThresholdPace: 97, maxPctThresholdPace: 100 },
  { zone: "Z5b", label: "Aerobic Capacity", minPctThresholdPace: 90, maxPctThresholdPace: 96 },
  { zone: "Z5c", label: "Anaerobic Capacity", minPctThresholdPace: null, maxPctThresholdPace: 90 },
] as const;

// Friel run HR zones (% LTHR).
// SOURCE: Joe Friel Quick Guide to Setting Zones,
// https://www.trainingpeaks.com/learn/articles/joe-friel-s-quick-guide-to-setting-zones/
export const FRIEL_RUN_HR_ZONE_BOUNDS = [
  { zone: "Z1", label: "Recovery", minPctLthr: null, maxPctLthr: 85 },
  { zone: "Z2", label: "Aerobic", minPctLthr: 85, maxPctLthr: 89 },
  { zone: "Z3", label: "Tempo", minPctLthr: 90, maxPctLthr: 94 },
  { zone: "Z4", label: "SubThreshold", minPctLthr: 95, maxPctLthr: 99 },
  { zone: "Z5a", label: "SuperThreshold", minPctLthr: 100, maxPctLthr: 102 },
  { zone: "Z5b", label: "Aerobic Capacity", minPctLthr: 103, maxPctLthr: 106 },
  { zone: "Z5c", label: "Anaerobic Capacity", minPctLthr: 106, maxPctLthr: null },
] as const;

// Friel bike HR zones (% LTHR).
// SOURCE: Joe Friel Quick Guide to Setting Zones,
// https://www.trainingpeaks.com/learn/articles/joe-friel-s-quick-guide-to-setting-zones/
export const FRIEL_BIKE_HR_ZONE_BOUNDS = [
  { zone: "Z1", label: "Recovery", minPctLthr: null, maxPctLthr: 81 },
  { zone: "Z2", label: "Aerobic", minPctLthr: 81, maxPctLthr: 89 },
  { zone: "Z3", label: "Tempo", minPctLthr: 90, maxPctLthr: 93 },
  { zone: "Z4", label: "SubThreshold", minPctLthr: 94, maxPctLthr: 99 },
  { zone: "Z5a", label: "SuperThreshold", minPctLthr: 100, maxPctLthr: 102 },
  { zone: "Z5b", label: "Aerobic Capacity", minPctLthr: 103, maxPctLthr: 106 },
  { zone: "Z5c", label: "Anaerobic Capacity", minPctLthr: 106, maxPctLthr: null },
] as const;

// Swim CSS±offset zones (seconds per 100 m relative to CSS).
// Positive offset = slower than CSS. Follows Friel's "T-time + 5 s" convention for easy work.
// SOURCE: project default, tune (offsets); Friel Quick Guide for T-time ± convention,
// https://www.trainingpeaks.com/learn/articles/joe-friel-s-quick-guide-to-setting-zones/
export const SWIM_CSS_ZONE_OFFSETS = [
  { zone: "Z1", label: "Recovery", minOffsetSec: 15, maxOffsetSec: null },
  { zone: "Z2", label: "Aerobic", minOffsetSec: 5, maxOffsetSec: 14 },
  { zone: "Z3", label: "Tempo", minOffsetSec: 1, maxOffsetSec: 4 },
  { zone: "Z4", label: "Threshold", minOffsetSec: -2, maxOffsetSec: 0 },
  { zone: "Z5", label: "VO2 / Speed", minOffsetSec: null, maxOffsetSec: -3 },
] as const;

// CSS formula: (T400 − T200) / 2.
// SOURCE: TrainingPeaks threshold tests,
// https://www.trainingpeaks.com/blog/threshold-tests-for-swim-bike-and-run/
export const CSS_DISTANCE_PAIR_DIVISOR = 2;

// IRONMAN 70.3 Da Nang race distances and cut-offs.
// SOURCE: ironman.com race page / 2026 Athlete Guide (PLAN.md §2)
export const RACE_SWIM_M = 1900;
export const RACE_BIKE_M = 90000;
export const RACE_RUN_M = 21100;
export const CUTOFF_SWIM_SEC = 4200; // 1:10
export const CUTOFF_SWIM_T1_BIKE_SEC = 19800; // 5:30
export const CUTOFF_TOTAL_SEC = 30600; // 8:30

// Stretch sub-6:00 starting splits (PLAN.md §4.2).
// SOURCE: project default, tune (recompute after CSS/FTP tests)
export const DEFAULT_SUB600_SPLITS_SEC = {
  swimSec: 3000, // 0:50:00
  t1Sec: 420, // 0:07:00
  bikeSec: 10800, // 3:00:00
  t2Sec: 240, // 0:04:00
  runSec: 6900, // 1:55:00
} as const;

// Heat-adjusted run pacing (Ely et al. 2007).
// Slowdown for ~3-hour marathoners ≈ 3.2% per 5 °C WBGT rise, relative to the 5–10 °C band.
// SOURCE: Ely et al. 2007, https://pubmed.ncbi.nlm.nih.gov/17473775/
export const HEAT_SLOWDOWN_PCT_PER_5C_WBGT = 3.2;
export const HEAT_REFERENCE_WBGT_C = 10; // top of coolest studied band (5–10 °C)
export const HEAT_STUDIED_MAX_WBGT_C = 25; // above this → extrapolated warning

// Race distances recognised by the VDOT estimator (metres).
// SOURCE: project default, tune (standard road distances)
export const VDOT_HALF_MARATHON_M = 21097.5;
export const VDOT_MARATHON_M = 42195;
export const VDOT_DISTANCE_TOLERANCE_M = 1;

// Daniels VDOT table rows used for interpolation.
// halfMarathonSec / marathonSec from Table 1; thresholdPaceSecPerKm from Table 2 T-per-1000 m.
// SOURCE: Jack Daniels VDOT tables via Coaches Education,
// https://coacheseducation.com/pdfs/vdot-tables.pdf
export const VDOT_TABLE = [
  { vdot: 30, halfMarathonSec: 8464, marathonSec: 17357, thresholdPaceSecPerKm: 384 }, // T 6:24
  { vdot: 32, halfMarathonSec: 8029, marathonSec: 16499, thresholdPaceSecPerKm: 365 }, // T 6:05
  { vdot: 34, halfMarathonSec: 7636, marathonSec: 15723, thresholdPaceSecPerKm: 348 }, // T 5:48
  { vdot: 36, halfMarathonSec: 7279, marathonSec: 15019, thresholdPaceSecPerKm: 333 }, // T 5:33
  { vdot: 38, halfMarathonSec: 6955, marathonSec: 14375, thresholdPaceSecPerKm: 319 }, // T 5:19
  { vdot: 40, halfMarathonSec: 6659, marathonSec: 13785, thresholdPaceSecPerKm: 306 }, // T 5:06
  { vdot: 42, halfMarathonSec: 6387, marathonSec: 13243, thresholdPaceSecPerKm: 294 }, // T 4:54
  { vdot: 44, halfMarathonSec: 6137, marathonSec: 12743, thresholdPaceSecPerKm: 283 }, // T 4:43
  { vdot: 45, halfMarathonSec: 6020, marathonSec: 12506, thresholdPaceSecPerKm: 278 }, // T 4:38
  { vdot: 46, halfMarathonSec: 5907, marathonSec: 12279, thresholdPaceSecPerKm: 273 }, // T 4:33
  { vdot: 47, halfMarathonSec: 5798, marathonSec: 12060, thresholdPaceSecPerKm: 269 }, // T 4:29
  { vdot: 48, halfMarathonSec: 5693, marathonSec: 11849, thresholdPaceSecPerKm: 264 }, // T 4:24
  { vdot: 49, halfMarathonSec: 5592, marathonSec: 11646, thresholdPaceSecPerKm: 260 }, // T 4:20
  { vdot: 50, halfMarathonSec: 5495, marathonSec: 11449, thresholdPaceSecPerKm: 255 }, // T 4:15
  { vdot: 51, halfMarathonSec: 5402, marathonSec: 11259, thresholdPaceSecPerKm: 251 }, // T 4:11
  { vdot: 52, halfMarathonSec: 5311, marathonSec: 11076, thresholdPaceSecPerKm: 247 }, // T 4:07
  { vdot: 53, halfMarathonSec: 5224, marathonSec: 10899, thresholdPaceSecPerKm: 244 }, // T 4:04
  { vdot: 54, halfMarathonSec: 5140, marathonSec: 10727, thresholdPaceSecPerKm: 240 }, // T 4:00
  { vdot: 55, halfMarathonSec: 5058, marathonSec: 10561, thresholdPaceSecPerKm: 236 }, // T 3:56
  { vdot: 56, halfMarathonSec: 4980, marathonSec: 10400, thresholdPaceSecPerKm: 233 }, // T 3:53
  { vdot: 57, halfMarathonSec: 4903, marathonSec: 10245, thresholdPaceSecPerKm: 230 }, // T 3:50
  { vdot: 58, halfMarathonSec: 4830, marathonSec: 10094, thresholdPaceSecPerKm: 225 }, // T 3:45
  { vdot: 59, halfMarathonSec: 4758, marathonSec: 9947, thresholdPaceSecPerKm: 223 }, // T 3:43
  { vdot: 60, halfMarathonSec: 4689, marathonSec: 9805, thresholdPaceSecPerKm: 220 }, // T 3:40
  { vdot: 61, halfMarathonSec: 4622, marathonSec: 9668, thresholdPaceSecPerKm: 217 }, // T 3:37
  { vdot: 62, halfMarathonSec: 4557, marathonSec: 9534, thresholdPaceSecPerKm: 214 }, // T 3:34
  { vdot: 63, halfMarathonSec: 4494, marathonSec: 9404, thresholdPaceSecPerKm: 212 }, // T 3:32
  { vdot: 64, halfMarathonSec: 4433, marathonSec: 9278, thresholdPaceSecPerKm: 209 }, // T 3:29
  { vdot: 65, halfMarathonSec: 4373, marathonSec: 9155, thresholdPaceSecPerKm: 206 }, // T 3:26
  { vdot: 66, halfMarathonSec: 4316, marathonSec: 9036, thresholdPaceSecPerKm: 204 }, // T 3:24
  { vdot: 67, halfMarathonSec: 4260, marathonSec: 8920, thresholdPaceSecPerKm: 201 }, // T 3:21
  { vdot: 68, halfMarathonSec: 4205, marathonSec: 8807, thresholdPaceSecPerKm: 199 }, // T 3:19
  { vdot: 69, halfMarathonSec: 4152, marathonSec: 8697, thresholdPaceSecPerKm: 196 }, // T 3:16
  { vdot: 70, halfMarathonSec: 4101, marathonSec: 8590, thresholdPaceSecPerKm: 194 }, // T 3:14
  { vdot: 71, halfMarathonSec: 4051, marathonSec: 8486, thresholdPaceSecPerKm: 192 }, // T 3:12
  { vdot: 72, halfMarathonSec: 4002, marathonSec: 8384, thresholdPaceSecPerKm: 190 }, // T 3:10
  { vdot: 73, halfMarathonSec: 3954, marathonSec: 8285, thresholdPaceSecPerKm: 188 }, // T 3:08
  { vdot: 74, halfMarathonSec: 3908, marathonSec: 8189, thresholdPaceSecPerKm: 186 }, // T 3:06
  { vdot: 75, halfMarathonSec: 3863, marathonSec: 8095, thresholdPaceSecPerKm: 184 }, // T 3:04
  { vdot: 76, halfMarathonSec: 3819, marathonSec: 8003, thresholdPaceSecPerKm: 182 }, // T 3:02
  { vdot: 77, halfMarathonSec: 3776, marathonSec: 7914, thresholdPaceSecPerKm: 180 }, // T 3:00
  { vdot: 78, halfMarathonSec: 3735, marathonSec: 7827, thresholdPaceSecPerKm: 178 }, // T 2:58
  { vdot: 79, halfMarathonSec: 3694, marathonSec: 7742, thresholdPaceSecPerKm: 176 }, // T 2:56
  { vdot: 80, halfMarathonSec: 3654, marathonSec: 7658, thresholdPaceSecPerKm: 174 }, // T 2:54
  { vdot: 81, halfMarathonSec: 3615, marathonSec: 7577, thresholdPaceSecPerKm: 173 }, // T 2:53
  { vdot: 82, halfMarathonSec: 3578, marathonSec: 7497, thresholdPaceSecPerKm: 171 }, // T 2:51
  { vdot: 83, halfMarathonSec: 3541, marathonSec: 7420, thresholdPaceSecPerKm: 169 }, // T 2:49
  { vdot: 84, halfMarathonSec: 3505, marathonSec: 7344, thresholdPaceSecPerKm: 168 }, // T 2:48
  { vdot: 85, halfMarathonSec: 3470, marathonSec: 7270, thresholdPaceSecPerKm: 166 }, // T 2:46
] as const;
