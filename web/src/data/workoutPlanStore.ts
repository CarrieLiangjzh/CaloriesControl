import type { GoalType } from "../domain/types";
import {
  buildWeekPlan,
  mondayOf,
  templateIdForGoal,
  type WeekPlan,
} from "../domain/workoutPlan";

export const WORKOUT_WEEK_KEY = "calories-control:workout-week:v1";

type WeekRecord = {
  weekStart: string;
  templateId: string;
  checked: Record<string, boolean>;
};

export function loadWeekPlan(goal: GoalType, now = new Date()): { plan: WeekPlan; checked: Record<string, boolean> } {
  const weekStart = mondayOf(now);
  const templateId = templateIdForGoal(goal);
  const stored = readRecord();
  const checked =
    stored && stored.weekStart === weekStart && stored.templateId === templateId
      ? stored.checked
      : {};
  return { plan: buildWeekPlan(goal, weekStart), checked };
}

export function togglePlanItem(goal: GoalType, itemId: string, now = new Date()): void {
  const { plan, checked } = loadWeekPlan(goal, now);
  const next = { ...checked, [itemId]: !checked[itemId] };
  writeRecord({
    weekStart: plan.weekStart,
    templateId: plan.templateId,
    checked: next,
  });
}

function readRecord(): WeekRecord | null {
  const raw = window.localStorage.getItem(WORKOUT_WEEK_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as WeekRecord;
    if (!record.weekStart || !record.templateId || typeof record.checked !== "object") {
      return null;
    }
    return record;
  } catch {
    return null;
  }
}

function writeRecord(record: WeekRecord): void {
  window.localStorage.setItem(WORKOUT_WEEK_KEY, JSON.stringify(record));
}
