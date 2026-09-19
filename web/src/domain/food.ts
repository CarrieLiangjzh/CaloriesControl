export type FoodAmountUnit = "g" | "ml" | "piece";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type FoodSource = "photo" | "manual";

export type FoodEntry = {
  id: string;
  date: string;
  mealType: MealType;
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  source: FoodSource;
  confidence?: number;
  amount?: number;
  unit?: FoodAmountUnit;
  kcalEstimated?: boolean;
};

export type FoodDraft = {
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: MealType;
  source: FoodSource;
  confidence?: number;
  baseGrams: number;
};

export type FoodTotals = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  snack: "加餐",
};

export function mealLabel(type: MealType): string {
  return MEAL_LABELS[type];
}

export function defaultMealType(now = new Date()): MealType {
  const hour = now.getHours();
  if (hour < 10) return "breakfast";
  if (hour < 14) return "lunch";
  if (hour < 21) return "dinner";
  return "snack";
}

export function scaleNutrition(
  draft: Pick<FoodDraft, "kcal" | "protein" | "carbs" | "fat" | "baseGrams">,
  grams: number,
): Pick<FoodEntry, "kcal" | "protein" | "carbs" | "fat"> {
  const base = draft.baseGrams > 0 ? draft.baseGrams : 1;
  const ratio = Math.max(0, grams) / base;
  return {
    kcal: Math.round(draft.kcal * ratio),
    protein: round1(draft.protein * ratio),
    carbs: round1(draft.carbs * ratio),
    fat: round1(draft.fat * ratio),
  };
}

export function sumFood(entries: FoodEntry[]): FoodTotals {
  return entries.reduce(
    (sum, item) => ({
      kcal: sum.kcal + item.kcal,
      protein: round1(sum.protein + item.protein),
      carbs: round1(sum.carbs + item.carbs),
      fat: round1(sum.fat + item.fat),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function newFoodId(now = new Date()): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `food-${now.getTime()}-${Math.floor(Math.random() * 10000)}`;
}

export function parseFoodAmountUnit(value: string): FoodAmountUnit {
  if (value === "ml" || value === "piece") return value;
  return "g";
}

export function formatFoodPortion(entry: FoodEntry): string {
  if (entry.amount && entry.unit) {
    const unitLabel =
      entry.unit === "g" ? "克" : entry.unit === "ml" ? "毫升" : "个";
    return `${entry.amount} ${unitLabel}`;
  }
  return `${entry.grams} 克`;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
