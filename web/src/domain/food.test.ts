import { describe, expect, it } from "vitest";
import {
  defaultMealType,
  formatFoodPortion,
  parseFoodAmountUnit,
  scaleNutrition,
  sumFood,
  type FoodEntry,
} from "./food";
import { analysisToDraft, parseFoodAnalysisText } from "./foodAnalysis";

describe("scaleNutrition", () => {
  it("scales macros with grams", () => {
    const scaled = scaleNutrition(
      { kcal: 400, protein: 20, carbs: 40, fat: 10, baseGrams: 200 },
      100,
    );
    expect(scaled).toEqual({ kcal: 200, protein: 10, carbs: 20, fat: 5 });
  });

  it("uses 1 as the base when original grams are 0", () => {
    const scaled = scaleNutrition(
      { kcal: 100, protein: 10, carbs: 10, fat: 2, baseGrams: 0 },
      2,
    );
    expect(scaled.kcal).toBe(200);
  });
});

describe("parseFoodAnalysisText", () => {
  it("reads json even when wrapped in a markdown fence", () => {
    const text = '```json\n{"name":"米饭","grams":150,"kcal":174,"protein":4,"carbs":38,"fat":0.4,"confidence":0.8}\n```';
    const parsed = parseFoodAnalysisText(text);
    expect(parsed.name).toBe("米饭");
    expect(parsed.grams).toBe(150);
    expect(parsed.kcal).toBe(174);
    expect(parsed.confidence).toBe(0.8);
  });

  it("rejects json without a name", () => {
    expect(() => parseFoodAnalysisText('{"grams":100,"kcal":200}')).toThrow();
  });

  it("turns analysis into a photo draft that can be scaled", () => {
    const draft = analysisToDraft(
      {
        name: "鸡胸",
        grams: 200,
        kcal: 330,
        protein: 62,
        carbs: 0,
        fat: 7,
        confidence: 0.9,
      },
      "lunch",
    );
    expect(draft.source).toBe("photo");
    expect(draft.baseGrams).toBe(200);
    expect(scaleNutrition(draft, 100).kcal).toBe(165);
  });
});

describe("defaultMealType", () => {
  it("picks lunch around noon", () => {
    expect(defaultMealType(new Date(2026, 8, 16, 12, 0))).toBe("lunch");
  });
});

describe("food portion", () => {
  it("parses amount units", () => {
    expect(parseFoodAmountUnit("ml")).toBe("ml");
    expect(parseFoodAmountUnit("piece")).toBe("piece");
    expect(parseFoodAmountUnit("other")).toBe("g");
  });

  it("prefers the typed amount and unit", () => {
    expect(
      formatFoodPortion({
        id: "1",
        date: "2026-09-19",
        mealType: "snack",
        name: "牛奶",
        grams: 258,
        kcal: 139,
        protein: 8,
        carbs: 13,
        fat: 6,
        source: "manual",
        amount: 250,
        unit: "ml",
      }),
    ).toBe("250 毫升");
  });
});

describe("sumFood", () => {
  it("adds kcal from the day", () => {
    const entries: FoodEntry[] = [
      {
        id: "1",
        date: "2026-09-16",
        mealType: "breakfast",
        name: "蛋",
        grams: 50,
        kcal: 80,
        protein: 7,
        carbs: 1,
        fat: 5,
        source: "manual",
      },
      {
        id: "2",
        date: "2026-09-16",
        mealType: "lunch",
        name: "饭",
        grams: 150,
        kcal: 174,
        protein: 4,
        carbs: 38,
        fat: 0.4,
        source: "photo",
      },
    ];
    expect(sumFood(entries).kcal).toBe(254);
  });
});
