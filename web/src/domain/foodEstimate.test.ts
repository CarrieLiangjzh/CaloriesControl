import { describe, expect, it } from "vitest";
import { estimateManualFood, macrosFromKcal } from "./foodEstimate";

describe("estimateManualFood", () => {
  it("scales catalog food by grams", () => {
    const estimated = estimateManualFood("鸡胸沙拉", 150, "g");
    expect(estimated.matched).toBe("鸡胸");
    expect(estimated.grams).toBe(150);
    expect(estimated.kcal).toBe(248);
    expect(estimated.protein).toBe(46.5);
  });

  it("uses per-piece calories for counted foods", () => {
    const estimated = estimateManualFood("茶叶蛋", 2, "piece");
    expect(estimated.matched).toBe("鸡蛋");
    expect(estimated.grams).toBe(100);
    expect(estimated.kcal).toBe(156);
  });

  it("converts milliliters with density", () => {
    const estimated = estimateManualFood("低脂牛奶", 250, "ml");
    expect(estimated.matched).toBe("牛奶");
    expect(estimated.grams).toBe(258);
    expect(estimated.kcal).toBe(139);
  });

  it("falls back when the name is unknown", () => {
    const estimated = estimateManualFood("神秘料理", 100, "g");
    expect(estimated.matched).toBeNull();
    expect(estimated.kcal).toBe(160);
  });

  it("defaults empty amount by unit", () => {
    expect(estimateManualFood("米饭", 0, "g").grams).toBe(100);
    expect(estimateManualFood("鸡蛋", 0, "piece").grams).toBe(50);
  });
});

describe("macrosFromKcal", () => {
  it("splits energy 20/50/30", () => {
    expect(macrosFromKcal(200)).toEqual({
      protein: 10,
      carbs: 25,
      fat: 6.7,
    });
  });
});
