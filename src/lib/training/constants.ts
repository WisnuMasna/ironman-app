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
