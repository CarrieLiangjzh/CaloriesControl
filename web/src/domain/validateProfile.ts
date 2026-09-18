import type { ActivityLevel } from "./goalConfig";
import { GOAL_CONFIG } from "./goalConfig";
import type { GoalType, Profile, Sex } from "./types";

export type ProfileValidation =
  | { ok: true; profile: Profile }
  | { ok: false; errors: Record<string, string> };

const ACTIVITY_LEVELS = new Set<string>(Object.keys(GOAL_CONFIG.activity));

export function validateProfile(input: Record<string, unknown>): ProfileValidation {
  const errors: Record<string, string> = {};

  const sex = parseSex(input.sex);
  if (!sex) errors.sex = "请选择性别";

  const age = parseNumber(input.age);
  if (age === undefined || age < 14 || age > 80) {
    errors.age = "年龄请填 14–80";
  }

  const heightCm = parseNumber(input.heightCm);
  if (heightCm === undefined || heightCm < 120 || heightCm > 220) {
    errors.heightCm = "身高请填 120–220 厘米";
  }

  const weightKg = parseNumber(input.weightKg);
  if (weightKg === undefined || weightKg < 30 || weightKg > 250) {
    errors.weightKg = "体重请填 30–250 公斤";
  }

  const targetWeightKg = parseNumber(input.targetWeightKg);
  if (targetWeightKg === undefined || targetWeightKg < 30 || targetWeightKg > 250) {
    errors.targetWeightKg = "目标体重请填 30–250 公斤";
  }

  const goal = parseGoal(input.goal);
  if (!goal) errors.goal = "请选择目标";

  const activityLevel = parseActivity(input.activityLevel);
  if (!activityLevel) errors.activityLevel = "请选择活动水平";

  let bodyFatPercent: number | undefined;
  if (input.bodyFatPercent !== "" && input.bodyFatPercent !== undefined && input.bodyFatPercent !== null) {
    const fat = parseNumber(input.bodyFatPercent);
    if (fat === undefined || fat < 5 || fat > 50) {
      errors.bodyFatPercent = "体脂率选填，范围 5–50%";
    } else {
      bodyFatPercent = fat;
    }
  }

  if (Object.keys(errors).length > 0 || !sex || !goal || !activityLevel) {
    return { ok: false, errors };
  }

  const profile: Profile = {
    sex,
    age: age as number,
    heightCm: heightCm as number,
    weightKg: weightKg as number,
    targetWeightKg: targetWeightKg as number,
    goal,
    activityLevel,
  };
  if (bodyFatPercent !== undefined) {
    profile.bodyFatPercent = bodyFatPercent;
  }
  return { ok: true, profile };
}

function parseNumber(value: unknown): number | undefined {
  if (value === "" || value === undefined || value === null) return undefined;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : undefined;
}

function parseSex(value: unknown): Sex | undefined {
  return value === "male" || value === "female" ? value : undefined;
}

function parseGoal(value: unknown): GoalType | undefined {
  return value === "lose" || value === "gain" || value === "maintain"
    ? value
    : undefined;
}

function parseActivity(value: unknown): ActivityLevel | undefined {
  return typeof value === "string" && ACTIVITY_LEVELS.has(value)
    ? (value as ActivityLevel)
    : undefined;
}
