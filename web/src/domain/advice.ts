import type { FoodTotals } from "./food";
import type { DailyTargets, Profile } from "./types";
import type { HealthDayCache, WorkoutSnapshot } from "./shortcutSync";

export type DietAction = "avoid" | "reduce" | "increase";
export type TrainingAction =
  | "follow_plan"
  | "rest"
  | "add_strength"
  | "easy_cardio"
  | "shorten";

export type DietReason =
  | "intake_over_target"
  | "protein_low"
  | "remaining_tight"
  | "post_hard_session"
  | "remaining_to_fill"
  | "maintain_course";

export type TrainingReason =
  | "planned_session_pending"
  | "already_trained"
  | "consecutive_high_intensity"
  | "recent_high_intensity"
  | "low_activity_on_cut";

export type DietAdvice = {
  action: DietAction;
  target: string;
  detail: string;
  reason: DietReason;
  priority: number;
};

export type TrainingAdvice = {
  action: TrainingAction;
  title: string;
  detail: string;
  reason: TrainingReason;
};

export type AdviceNumbers = {
  targetKcal: number;
  foodKcal: number;
  watchActiveKcal: number;
  remainingKcal: number;
  proteinG: number;
  proteinTargetG: number;
};

export type DailyAdvice = {
  diet: DietAdvice[];
  training: TrainingAdvice;
  numbers: AdviceNumbers;
};

export type DayLoad = {
  date: string;
  activeKcal: number;
  workouts: WorkoutSnapshot[];
};

export type PlannedTodayItem = {
  name: string;
  kind: "strength" | "cardio" | "walk" | "other";
  minutes: number;
  done: boolean;
  synced: boolean;
};

export type PlannedToday = {
  title: string;
  items: PlannedTodayItem[];
};

export type DailyContext = {
  profile: Profile;
  targets: DailyTargets;
  food: FoodTotals;
  health: HealthDayCache | null;
  recentDays: DayLoad[];
  now: Date;
  plannedToday?: PlannedToday | null;
};

export function dietActionLabel(action: DietAction): string {
  if (action === "avoid") return "不吃";
  if (action === "reduce") return "减量";
  return "加量";
}

export function trainingActionLabel(action: TrainingAction): string {
  switch (action) {
    case "rest":
      return "休息";
    case "add_strength":
      return "力量加量";
    case "easy_cardio":
      return "补低强度有氧";
    case "shorten":
      return "缩短训练";
    default:
      return "按计划训练";
  }
}
