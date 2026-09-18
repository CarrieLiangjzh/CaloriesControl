export const GOAL_CONFIG = {
  mifflin: {
    weightKg: 10,
    heightCm: 6.25,
    ageYears: 5,
    maleOffset: 5,
    femaleOffset: -161,
  },
  katch: {
    intercept: 370,
    leanMassKg: 21.6,
  },
  activity: {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.825,
    extraActive: 1.9,
  },
  loseDeltaKcal: 400,
  gainDeltaKcal: 250,
  bmrFloorFactor: 1.1,
  minKcal: {
    male: 1500,
    female: 1200,
  },
  proteinGPerKg: {
    lose: 2.0,
    gain: 1.8,
    maintain: 1.8,
  },
  proteinGPerKgClamp: { min: 1.2, max: 3.0 },
  fatKcalFraction: 0.25,
  kcalPerGram: {
    protein: 4,
    carb: 4,
    fat: 9,
  },
  adultAgeMin: 18,
} as const;

export type ActivityLevel = keyof typeof GOAL_CONFIG.activity;
