import type { DayLoad } from "./advice";
import { ADVICE_CONFIG } from "./adviceConfig";
import type { WorkoutSnapshot } from "./shortcutSync";

export type WorkoutKind = "strength" | "cardio" | "walk" | "other";

export function workoutKind(item: WorkoutSnapshot): WorkoutKind {
  const text = `${item.type} ${item.note ?? ""}`.toLowerCase();
  if (/walk|步行|散步|hiking|徒步/.test(text)) return "walk";
  if (/strength|weight|gym|lift|力量|器械|卧推|深蹲|引体|阻力/.test(text)) {
    return "strength";
  }
  if (
    /run|jog|cycl|bike|swim|row|elliptical|hiit|有氧|跑步|骑|游泳|操/.test(text)
  ) {
    return "cardio";
  }
  return "other";
}

export function sessionMinutes(item: WorkoutSnapshot): number {
  return Number.isFinite(item.minutes) ? Math.max(0, item.minutes ?? 0) : 0;
}

export function minutesOfKind(workouts: WorkoutSnapshot[], kind: WorkoutKind): number {
  return workouts
    .filter((item) => workoutKind(item) === kind)
    .reduce((sum, item) => sum + sessionMinutes(item), 0);
}

export function dayHasTrainedKind(
  workouts: WorkoutSnapshot[],
  kind: WorkoutKind,
  minMinutes = ADVICE_CONFIG.trainedMinutes,
): boolean {
  if (minutesOfKind(workouts, kind) >= minMinutes) return true;
  return workouts.some(
    (item) => workoutKind(item) === kind && sessionMinutes(item) >= minMinutes,
  );
}

export function isHighIntensityDay(day: DayLoad): boolean {
  return day.workouts.some((item) => {
    const kind = workoutKind(item);
    if (kind === "walk") return false;
    const text = `${item.type} ${item.note ?? ""}`;
    if (/hiit|高强度/.test(text)) return true;
    const minutes = sessionMinutes(item);
    const kcal = item.kcal ?? 0;
    if ((kind === "cardio" || kind === "strength") && minutes >= ADVICE_CONFIG.trainedMinutes) {
      return true;
    }
    if ((kind === "cardio" || kind === "strength") && kcal >= 250) return true;
    return false;
  });
}

export function consecutiveHighIntensityDays(days: DayLoad[]): number {
  let count = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (!isHighIntensityDay(days[i])) break;
    count += 1;
  }
  return count;
}

export function highIntensityInRecentDays(days: DayLoad[], lastN: number): boolean {
  return days.slice(-lastN).some((day) => isHighIntensityDay(day));
}
