import { describe, expect, it } from "vitest";
import { GOAL_CONFIG } from "./goalConfig";
import { computeDailyTargets, katchBmr, mifflinBmr } from "./goalMath";
import type { Profile } from "./types";

const maleBase: Profile = {
  sex: "male",
  age: 30,
  heightCm: 180,
  weightKg: 80,
  targetWeightKg: 75,
  goal: "maintain",
  activityLevel: "sedentary",
};

const femaleBase: Profile = {
  sex: "female",
  age: 25,
  heightCm: 165,
  weightKg: 60,
  targetWeightKg: 55,
  goal: "maintain",
  activityLevel: "sedentary",
};

describe("mifflinBmr", () => {
  it("matches the male Mifflin-St Jeor example", () => {
    expect(mifflinBmr(maleBase)).toBe(1780);
  });

  it("matches the female Mifflin-St Jeor example", () => {
    expect(mifflinBmr(femaleBase)).toBe(1345.25);
  });
});

describe("katchBmr", () => {
  it("uses lean mass when body fat is set", () => {
    expect(katchBmr({ weightKg: 80, bodyFatPercent: 20 })).toBe(1752.4);
  });
});

describe("computeDailyTargets", () => {
  it("uses sedentary multiplier for TDEE", () => {
    const targets = computeDailyTargets(maleBase);
    expect(targets.tdee).toBe(Math.round(1780 * GOAL_CONFIG.activity.sedentary));
    expect(targets.targetKcal).toBe(targets.tdee);
    expect(targets.formula).toBe("mifflin");
  });

  it("raises a cut up to the adult safety floor instead of TDEE minus 400", () => {
    const targets = computeDailyTargets({ ...maleBase, goal: "lose" });
    const floor = Math.round(
      Math.max(1780 * GOAL_CONFIG.bmrFloorFactor, GOAL_CONFIG.minKcal.male),
    );
    expect(targets.calorieFloor).toBe(floor);
    expect(targets.targetKcal).toBe(floor);
    expect(targets.usedAdultSafetyFloor).toBe(true);
    expect(targets.targetKcal).toBeGreaterThan(targets.tdee - GOAL_CONFIG.loseDeltaKcal);
  });

  it("adds a surplus when the goal is muscle gain", () => {
    const targets = computeDailyTargets({ ...maleBase, goal: "gain" });
    expect(targets.targetKcal).toBe(targets.tdee + GOAL_CONFIG.gainDeltaKcal);
    expect(targets.proteinG).toBe(Math.round(80 * GOAL_CONFIG.proteinGPerKg.gain));
  });

  it("uses the higher protein multiplier for fat loss", () => {
    const targets = computeDailyTargets({ ...femaleBase, goal: "lose" });
    expect(targets.proteinG).toBe(
      Math.round(60 * GOAL_CONFIG.proteinGPerKg.lose),
    );
  });

  it("forces maintain calories for minors even if they pick fat loss", () => {
    const targets = computeDailyTargets({
      ...femaleBase,
      age: 16,
      goal: "lose",
    });
    expect(targets.forcedMaintainBecauseMinor).toBe(true);
    expect(targets.targetKcal).toBe(targets.tdee);
    expect(targets.usedAdultSafetyFloor).toBe(false);
  });

  it("switches to Katch-McArdle when body fat is provided", () => {
    const targets = computeDailyTargets({
      ...maleBase,
      bodyFatPercent: 20,
    });
    expect(targets.formula).toBe("katch");
    expect(targets.bmr).toBe(1752.4);
  });
});
