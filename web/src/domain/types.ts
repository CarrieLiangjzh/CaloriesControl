import type { ActivityLevel } from "./goalConfig";

export type Sex = "male" | "female";
export type GoalType = "lose" | "gain" | "maintain";

export type Profile = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  goal: GoalType;
  activityLevel: ActivityLevel;
  bodyFatPercent?: number;
  proteinGPerKg?: number;
};

export type DailyTargets = {
  bmr: number;
  tdee: number;
  targetKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  formula: "mifflin" | "katch";
  calorieFloor: number;
  usedAdultSafetyFloor: boolean;
  forcedMaintainBecauseMinor: boolean;
};
