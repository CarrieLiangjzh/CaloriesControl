import { describe, expect, it } from "vitest";
import {
  buildWeekPlan,
  conflictsWithWatch,
  mondayOf,
  templateIdForGoal,
} from "./workoutPlan";

describe("workout templates", () => {
  it("maps goals to the three templates", () => {
    expect(templateIdForGoal("lose")).toBe("lose-3day");
    expect(templateIdForGoal("gain")).toBe("gain-4day");
    expect(templateIdForGoal("maintain")).toBe("maintain-full");
  });

  it("gives the cut template three strength days", () => {
    const plan = buildWeekPlan("lose", "2026-09-14");
    const strengthDays = plan.days.filter((day) =>
      day.items.some((item) => item.kind === "strength"),
    );
    expect(strengthDays).toHaveLength(3);
    expect(plan.days[0]?.items[0]?.id).toBe("2026-09-14:1:0");
  });

  it("skips planned cardio when a run is already on the watch", () => {
    const plan = buildWeekPlan("maintain", "2026-09-14");
    const cardio = plan.days.flatMap((day) => day.items).find((item) => item.kind === "cardio");
    expect(cardio).toBeTruthy();
    expect(conflictsWithWatch(cardio!, [{ type: "running", minutes: 32 }])).toBe(true);
    expect(
      conflictsWithWatch(plan.days[0].items[0], [{ type: "strength", minutes: 40 }]),
    ).toBe(true);
  });

  it("uses Monday as the week start", () => {
    expect(mondayOf(new Date(2026, 8, 16))).toBe("2026-09-14");
  });
});
