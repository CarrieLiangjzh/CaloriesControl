import { GOAL_CONFIG, type ActivityLevel } from "./goalConfig";
import type { DailyTargets, GoalType, Profile, Sex } from "./types";

export function computeDailyTargets(profile: Profile): DailyTargets {
  const formula = hasUsableBodyFat(profile.bodyFatPercent) ? "katch" : "mifflin";
  const bmr = formula === "katch" ? katchBmr(profile) : mifflinBmr(profile);
  const tdee = bmr * GOAL_CONFIG.activity[profile.activityLevel];
  const calorieFloor = Math.max(
    bmr * GOAL_CONFIG.bmrFloorFactor,
    GOAL_CONFIG.minKcal[profile.sex],
  );
  const minor = profile.age < GOAL_CONFIG.adultAgeMin;
  const effectiveGoal: GoalType = minor ? "maintain" : profile.goal;

  let targetKcal = tdee;
  if (effectiveGoal === "lose") {
    targetKcal = tdee - GOAL_CONFIG.loseDeltaKcal;
  } else if (effectiveGoal === "gain") {
    targetKcal = tdee + GOAL_CONFIG.gainDeltaKcal;
  }

  const usedAdultSafetyFloor =
    effectiveGoal === "lose" && targetKcal < calorieFloor;
  if (effectiveGoal === "lose") {
    targetKcal = Math.max(targetKcal, calorieFloor);
  }

  const proteinPerKg =
    profile.proteinGPerKg ?? GOAL_CONFIG.proteinGPerKg[effectiveGoal];
  const proteinG = profile.weightKg * clampProteinPerKg(proteinPerKg);
  const roundedKcal = Math.round(targetKcal);
  const roundedProtein = Math.round(proteinG);
  const macros = splitMacros(roundedKcal, roundedProtein);

  return {
    bmr: round1(bmr),
    tdee: Math.round(tdee),
    targetKcal: roundedKcal,
    proteinG: roundedProtein,
    carbsG: macros.carbsG,
    fatG: macros.fatG,
    formula,
    calorieFloor: Math.round(calorieFloor),
    usedAdultSafetyFloor,
    forcedMaintainBecauseMinor: minor && profile.goal !== "maintain",
  };
}

export function mifflinBmr(profile: Pick<Profile, "sex" | "age" | "heightCm" | "weightKg">): number {
  const { mifflin } = GOAL_CONFIG;
  const offset =
    profile.sex === "male" ? mifflin.maleOffset : mifflin.femaleOffset;
  return (
    mifflin.weightKg * profile.weightKg +
    mifflin.heightCm * profile.heightCm -
    mifflin.ageYears * profile.age +
    offset
  );
}

export function katchBmr(profile: Pick<Profile, "weightKg" | "bodyFatPercent">): number {
  const fat = profile.bodyFatPercent ?? 0;
  const leanMassKg = profile.weightKg * (1 - fat / 100);
  return GOAL_CONFIG.katch.intercept + GOAL_CONFIG.katch.leanMassKg * leanMassKg;
}

export function activityMultiplier(level: ActivityLevel): number {
  return GOAL_CONFIG.activity[level];
}

function hasUsableBodyFat(value: number | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function clampProteinPerKg(value: number): number {
  return Math.min(
    GOAL_CONFIG.proteinGPerKgClamp.max,
    Math.max(GOAL_CONFIG.proteinGPerKgClamp.min, value),
  );
}

function splitMacros(
  targetKcal: number,
  proteinG: number,
): { carbsG: number; fatG: number } {
  const { kcalPerGram, fatKcalFraction } = GOAL_CONFIG;
  const proteinKcal = proteinG * kcalPerGram.protein;
  const fatKcal = targetKcal * fatKcalFraction;
  const fatG = fatKcal / kcalPerGram.fat;
  const carbKcal = Math.max(0, targetKcal - proteinKcal - fatKcal);
  return {
    fatG: Math.round(fatG),
    carbsG: Math.round(carbKcal / kcalPerGram.carb),
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function goalLabel(goal: GoalType): string {
  if (goal === "lose") return "减脂";
  if (goal === "gain") return "增肌";
  return "维持";
}

export function sexLabel(sex: Sex): string {
  return sex === "male" ? "男" : "女";
}
