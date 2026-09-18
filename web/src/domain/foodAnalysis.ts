import type { FoodDraft } from "./food";

export type FoodAnalysisJson = {
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
};

export function parseFoodAnalysisText(text: string): FoodAnalysisJson {
  const trimmed = stripFence(text.trim());
  const parsed: unknown = JSON.parse(trimmed);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("识别结果不是对象");
  }
  const record = parsed as Record<string, unknown>;
  const name = String(record.name ?? "").trim();
  if (!name) throw new Error("没有菜名");
  const grams = requireNumber(record.grams, "grams");
  const kcal = requireNumber(record.kcal, "kcal");
  if (grams <= 0 || kcal < 0) throw new Error("克数或热量不合理");
  return {
    name,
    grams,
    kcal,
    protein: optionalNumber(record.protein),
    carbs: optionalNumber(record.carbs),
    fat: optionalNumber(record.fat),
    confidence: clamp01(optionalNumber(record.confidence, 0.5)),
  };
}

export function analysisToDraft(
  analysis: FoodAnalysisJson,
  mealType: FoodDraft["mealType"],
): FoodDraft {
  return {
    name: analysis.name,
    grams: analysis.grams,
    kcal: Math.round(analysis.kcal),
    protein: analysis.protein,
    carbs: analysis.carbs,
    fat: analysis.fat,
    mealType,
    source: "photo",
    confidence: analysis.confidence,
    baseGrams: analysis.grams,
  };
}

function stripFence(text: string): string {
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fence ? fence[1] : text;
}

function requireNumber(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`${field} 不是数字`);
  return n;
}

function optionalNumber(value: unknown, fallback = 0): number {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
