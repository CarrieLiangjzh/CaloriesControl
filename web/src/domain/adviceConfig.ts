export const ADVICE_ENGINE_VERSION = "v1";

export const ADVICE_CONFIG = {
  overTargetKcal: 150,
  avoidOverTargetKcal: 400,
  proteinLowRatio: 0.7,
  remainingTightKcal: 350,
  lowActivityKcal: 250,
  trainedMinutes: 30,
  lastMealHour: 21,
  lunchApproachStart: 11,
  lunchApproachEnd: 14,
  dinnerApproachStart: 17,
  dinnerApproachEnd: 21,
} as const;
