import type { GoalType } from "./types";
import { dayHasTrainedKind, type WorkoutKind } from "./trainingLoad";
import { localDateISO, type WorkoutSnapshot } from "./shortcutSync";

export type PlanTemplateId = "lose-3day" | "gain-4day" | "maintain-full";

export type PlanItem = {
  id: string;
  name: string;
  kind: WorkoutKind | "rest";
  minutes: number;
};

export type PlanDay = {
  weekday: number;
  title: string;
  items: PlanItem[];
};

export type WeekPlan = {
  weekStart: string;
  templateId: PlanTemplateId;
  days: PlanDay[];
};

export type PlanItemStatus = "open" | "done" | "synced";

export function templateIdForGoal(goal: GoalType): PlanTemplateId {
  if (goal === "lose") return "lose-3day";
  if (goal === "gain") return "gain-4day";
  return "maintain-full";
}

export function templateLabel(id: PlanTemplateId): string {
  if (id === "lose-3day") return "减脂 3 日";
  if (id === "gain-4day") return "增肌 4 日";
  return "维持全身";
}

export function mondayOf(now = new Date()): string {
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return localDateISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff));
}

export function weekdayIndex(now = new Date()): number {
  return now.getDay();
}

export function buildWeekPlan(goal: GoalType, weekStart: string): WeekPlan {
  const templateId = templateIdForGoal(goal);
  const days = daysForTemplate(templateId).map((day) => ({
    ...day,
    items: day.items.map((item, index) => ({
      ...item,
      id: `${weekStart}:${day.weekday}:${index}`,
    })),
  }));
  return { weekStart, templateId, days };
}

export function planDayForDate(plan: WeekPlan, now = new Date()): PlanDay | null {
  const weekday = weekdayIndex(now);
  return plan.days.find((day) => day.weekday === weekday) ?? null;
}

export function itemStatus(
  item: PlanItem,
  checked: boolean,
  workouts: WorkoutSnapshot[],
): PlanItemStatus {
  if (conflictsWithWatch(item, workouts)) return "synced";
  if (checked) return "done";
  return "open";
}

export function conflictsWithWatch(item: PlanItem, workouts: WorkoutSnapshot[]): boolean {
  if (item.kind === "cardio") return dayHasTrainedKind(workouts, "cardio");
  if (item.kind === "strength") return dayHasTrainedKind(workouts, "strength");
  return false;
}

export function statusLabel(status: PlanItemStatus): string {
  if (status === "synced") return "手表已记，不叠加";
  if (status === "done") return "已勾选";
  return "";
}

function daysForTemplate(id: PlanTemplateId): PlanDay[] {
  if (id === "lose-3day") {
    return [
      day(1, "全身力量", [strength("深蹲或分腿蹲", 15), strength("俯卧撑或推胸", 12), strength("划船或反向划船", 12)]),
      day(2, "步行恢复", [walk("轻松步行", 30)]),
      day(3, "上肢力量", [strength("推肩", 12), strength("划船", 12), strength("核心平板", 8)]),
      day(4, "步行", [walk("步行", 30)]),
      day(5, "下肢力量", [strength("深蹲或臀桥", 15), strength("罗马尼亚硬拉", 12), strength("弓步", 10)]),
      day(6, "轻松步行", [walk("散步", 30)]),
      day(0, "休息", [rest()]),
    ];
  }
  if (id === "gain-4day") {
    return [
      day(1, "推（胸肩三头）", [strength("卧推或俯卧撑", 15), strength("肩推", 12), strength("臂屈伸", 10)]),
      day(2, "拉（背二头）", [strength("划船", 15), strength("引体或下拉", 12), strength("弯举", 8)]),
      day(3, "休息或散步", [walk("散步", 20)]),
      day(4, "腿", [strength("深蹲", 15), strength("硬拉变式", 12), strength("箭步蹲", 10)]),
      day(5, "上肢综合", [strength("推类动作", 12), strength("拉类动作", 12), strength("核心", 8)]),
      day(6, "休息", [rest()]),
      day(0, "休息", [rest()]),
    ];
  }
  return [
    day(1, "全身 A", [strength("深蹲", 12), strength("推", 12), strength("划船", 12)]),
    day(2, "步行", [walk("步行", 30)]),
    day(3, "全身 B", [strength("臀桥或硬拉", 12), strength("推肩", 10), strength("核心", 8)]),
    day(4, "步行", [walk("步行", 30)]),
    day(5, "全身 C", [strength("弓步", 12), strength("俯卧撑", 10), strength("划船", 10)]),
    day(6, "轻松活动", [walk("散步", 20), { name: "可选轻松骑行或慢跑", kind: "cardio", minutes: 20 }]),
    day(0, "休息", [rest()]),
  ];
}

type DraftItem = Omit<PlanItem, "id">;

function day(weekday: number, title: string, items: DraftItem[]): PlanDay {
  return {
    weekday,
    title,
    items: items.map((item) => ({ ...item, id: "" })),
  };
}

function strength(name: string, minutes: number): DraftItem {
  return { name, kind: "strength", minutes };
}

function walk(name: string, minutes: number): DraftItem {
  return { name, kind: "walk", minutes };
}

function rest(): DraftItem {
  return { name: "休息，不安排训练", kind: "rest", minutes: 0 };
}
