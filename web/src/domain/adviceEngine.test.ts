import { describe, expect, it } from "vitest";
import type { DailyContext, DayLoad } from "./advice";
import { computeAdvice } from "./adviceEngine";
import { computeDailyTargets } from "./goalMath";
import type { Profile } from "./types";
import type { HealthDayCache } from "./shortcutSync";

const profile: Profile = {
  sex: "male",
  age: 30,
  heightCm: 180,
  weightKg: 80,
  targetWeightKg: 75,
  goal: "lose",
  activityLevel: "moderate",
};

const targets = computeDailyTargets(profile);

function health(
  date: string,
  workouts: HealthDayCache["workouts"],
  activeKcal = 400,
): HealthDayCache {
  return {
    date,
    activeKcal,
    workouts,
    source: "shortcut",
    fetchedAt: "2026-09-16T10:00:00.000Z",
  };
}

function days(workoutsByOffset: HealthDayCache["workouts"][]): DayLoad[] {
  const dates = ["2026-09-14", "2026-09-15", "2026-09-16"];
  return dates.map((date, index) => ({
    date,
    activeKcal: 400,
    workouts: workoutsByOffset[index] ?? [],
  }));
}

function ctx(partial: Partial<DailyContext>): DailyContext {
  const now = partial.now ?? new Date(2026, 8, 16, 12, 0);
  const recentDays = partial.recentDays ?? days([[], [], []]);
  const today = recentDays[recentDays.length - 1];
  return {
    profile,
    targets,
    food: { kcal: 800, protein: 90, carbs: 80, fat: 20 },
    health: today
      ? health(today.date, today.workouts)
      : null,
    recentDays,
    now,
    ...partial,
  };
}

describe("computeAdvice diet", () => {
  it("reduces when intake is over target by more than 150 kcal", () => {
    const advice = computeAdvice(
      ctx({
        food: {
          kcal: targets.targetKcal + 200,
          protein: 160,
          carbs: 200,
          fat: 70,
        },
        now: new Date(2026, 8, 16, 12, 0),
      }),
    );
    expect(advice.diet[0]?.action).toBe("reduce");
    expect(advice.diet[0]?.reason).toBe("intake_over_target");
    expect(advice.numbers.foodKcal).toBe(targets.targetKcal + 200);
  });

  it("says avoid after a large surplus", () => {
    const advice = computeAdvice(
      ctx({
        food: {
          kcal: targets.targetKcal + 500,
          protein: 160,
          carbs: 250,
          fat: 80,
        },
        now: new Date(2026, 8, 16, 12, 0),
      }),
    );
    expect(advice.diet[0]?.action).toBe("avoid");
    expect(advice.diet[0]?.reason).toBe("intake_over_target");
  });

  it("increases protein when logged protein is below 70% before the last meal", () => {
    const advice = computeAdvice(
      ctx({
        food: { kcal: 700, protein: 20, carbs: 80, fat: 20 },
        now: new Date(2026, 8, 16, 12, 0),
      }),
    );
    const protein = advice.diet.find((item) => item.reason === "protein_low");
    expect(protein?.action).toBe("increase");
    expect(protein?.target).toBe("蛋白");
    expect(20).toBeLessThan(targets.proteinG * 0.7);
  });
});

describe("computeAdvice training", () => {
  it("does not stack more cardio after a 32-minute run", () => {
    const running = [{ type: "running", minutes: 32, kcal: 280 }];
    const advice = computeAdvice(
      ctx({
        recentDays: days([[], [], running]),
        health: health("2026-09-16", running, 500),
      }),
    );
    expect(advice.training.reason).toBe("already_trained");
    expect(advice.training.action).not.toBe("follow_plan");
    expect(advice.training.action).not.toBe("add_strength");
  });

  it("rests after three consecutive high-intensity days", () => {
    const hard = [{ type: "running", minutes: 40, kcal: 350 }];
    const advice = computeAdvice(
      ctx({
        recentDays: days([hard, hard, hard]),
        health: health("2026-09-16", hard, 500),
      }),
    );
    expect(advice.training.action).toBe("rest");
    expect(advice.training.reason).toBe("consecutive_high_intensity");
  });

  it("asks for easy cardio on a cut when watch burn is low and diet is on track", () => {
    const advice = computeAdvice(
      ctx({
        food: { kcal: 900, protein: 120, carbs: 90, fat: 25 },
        health: health("2026-09-16", [], 80),
        recentDays: days([[], [], []]),
      }),
    );
    expect(advice.training.action).toBe("easy_cardio");
    expect(advice.training.reason).toBe("low_activity_on_cut");
  });
});
