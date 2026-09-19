import type { FoodAmountUnit } from "./food";

export type ManualFoodEstimate = {
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  matched: string | null;
};

type CatalogItem = {
  keys: string[];
  kcalPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  gramsPerMl?: number;
  gramsPerPiece?: number;
  kcalPerPiece?: number;
};

const CATALOG: CatalogItem[] = [
  { keys: ["鸡胸"], kcalPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { keys: ["牛肉"], kcalPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15 },
  { keys: ["猪肉"], kcalPer100g: 242, proteinPer100g: 27, carbsPer100g: 0, fatPer100g: 14 },
  { keys: ["鸡蛋", "茶叶蛋", "水煮蛋"], kcalPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11, gramsPerPiece: 50, kcalPerPiece: 78 },
  { keys: ["米饭", "白饭"], kcalPer100g: 116, proteinPer100g: 2.6, carbsPer100g: 26, fatPer100g: 0.3 },
  { keys: ["粥", "白粥"], kcalPer100g: 46, proteinPer100g: 1.1, carbsPer100g: 9.4, fatPer100g: 0.3, gramsPerMl: 1 },
  { keys: ["面条", "挂面", "拉面"], kcalPer100g: 137, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 2 },
  { keys: ["馒头"], kcalPer100g: 223, proteinPer100g: 7, carbsPer100g: 47, fatPer100g: 1.1, gramsPerPiece: 80, kcalPerPiece: 178 },
  { keys: ["饺子"], kcalPer100g: 200, proteinPer100g: 8, carbsPer100g: 25, fatPer100g: 7, gramsPerPiece: 25, kcalPerPiece: 50 },
  { keys: ["包子"], kcalPer100g: 220, proteinPer100g: 8, carbsPer100g: 30, fatPer100g: 7, gramsPerPiece: 80, kcalPerPiece: 176 },
  { keys: ["豆腐"], kcalPer100g: 76, proteinPer100g: 8, carbsPer100g: 2, fatPer100g: 4 },
  { keys: ["牛奶"], kcalPer100g: 54, proteinPer100g: 3, carbsPer100g: 5, fatPer100g: 2.5, gramsPerMl: 1.03 },
  { keys: ["豆浆"], kcalPer100g: 31, proteinPer100g: 3, carbsPer100g: 1.2, fatPer100g: 1.6, gramsPerMl: 1 },
  { keys: ["酸奶"], kcalPer100g: 61, proteinPer100g: 3.5, carbsPer100g: 4.7, fatPer100g: 3.3, gramsPerMl: 1.04 },
  { keys: ["可乐", "雪碧"], kcalPer100g: 42, proteinPer100g: 0, carbsPer100g: 10.6, fatPer100g: 0, gramsPerMl: 1.04 },
  { keys: ["啤酒"], kcalPer100g: 43, proteinPer100g: 0.5, carbsPer100g: 3.6, fatPer100g: 0, gramsPerMl: 1 },
  { keys: ["拿铁", "咖啡"], kcalPer100g: 45, proteinPer100g: 2.4, carbsPer100g: 4, fatPer100g: 2, gramsPerMl: 1 },
  { keys: ["苹果"], kcalPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2, gramsPerPiece: 180, kcalPerPiece: 95 },
  { keys: ["香蕉"], kcalPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, gramsPerPiece: 120, kcalPerPiece: 105 },
  { keys: ["橙子", "橘子"], kcalPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 12, fatPer100g: 0.1, gramsPerPiece: 150, kcalPerPiece: 70 },
  { keys: ["西兰花"], kcalPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4 },
  { keys: ["沙拉"], kcalPer100g: 80, proteinPer100g: 4, carbsPer100g: 6, fatPer100g: 4 },
  { keys: ["面包"], kcalPer100g: 265, proteinPer100g: 9, carbsPer100g: 49, fatPer100g: 3.2, gramsPerPiece: 40, kcalPerPiece: 106 },
  { keys: ["巧克力"], kcalPer100g: 546, proteinPer100g: 7.6, carbsPer100g: 59, fatPer100g: 31 },
  { keys: ["坚果", "花生"], kcalPer100g: 567, proteinPer100g: 26, carbsPer100g: 16, fatPer100g: 49 },
  { keys: ["米饭套餐", "盖浇饭"], kcalPer100g: 150, proteinPer100g: 7, carbsPer100g: 20, fatPer100g: 4 },
];

const FALLBACK = {
  g: { kcal: 160, protein: 8, carbs: 18, fat: 6 },
  ml: { kcal: 45, protein: 1.5, carbs: 5, fat: 1.5 },
  piece: { kcal: 80, protein: 5, carbs: 8, fat: 3, grams: 60 },
};

export function estimateManualFood(
  name: string,
  amount: number,
  unit: FoodAmountUnit,
): ManualFoodEstimate {
  const qty = Number.isFinite(amount) && amount > 0 ? amount : unit === "piece" ? 1 : 100;
  const item = matchCatalog(name);
  const grams = estimateGrams(item, qty, unit);
  if (!item) {
    return scaleFallback(qty, unit, grams);
  }
  if (unit === "piece" && item.kcalPerPiece !== undefined) {
    const kcal = Math.round(item.kcalPerPiece * qty);
    return {
      grams,
      kcal,
      protein: round1(((item.proteinPer100g ?? 0) * grams) / 100),
      carbs: round1(((item.carbsPer100g ?? 0) * grams) / 100),
      fat: round1(((item.fatPer100g ?? 0) * grams) / 100),
      matched: item.keys[0] ?? null,
    };
  }
  const per100 = item.kcalPer100g ?? FALLBACK.g.kcal;
  return {
    grams,
    kcal: Math.round((per100 * grams) / 100),
    protein: round1(((item.proteinPer100g ?? 0) * grams) / 100),
    carbs: round1(((item.carbsPer100g ?? 0) * grams) / 100),
    fat: round1(((item.fatPer100g ?? 0) * grams) / 100),
    matched: item.keys[0] ?? null,
  };
}

export function macrosFromKcal(kcal: number): {
  protein: number;
  carbs: number;
  fat: number;
} {
  const energy = Math.max(0, kcal);
  return {
    protein: round1((energy * 0.2) / 4),
    carbs: round1((energy * 0.5) / 4),
    fat: round1((energy * 0.3) / 9),
  };
}

function matchCatalog(name: string): CatalogItem | null {
  const text = name.trim();
  if (!text) return null;
  let best: { item: CatalogItem; len: number } | null = null;
  for (const item of CATALOG) {
    for (const key of item.keys) {
      if (text.includes(key) && (!best || key.length > best.len)) {
        best = { item, len: key.length };
      }
    }
  }
  return best?.item ?? null;
}

function estimateGrams(
  item: CatalogItem | null,
  amount: number,
  unit: FoodAmountUnit,
): number {
  if (unit === "g") return Math.round(amount);
  if (unit === "ml") {
    const density = item?.gramsPerMl ?? 1;
    return Math.max(1, Math.round(amount * density));
  }
  const piece = item?.gramsPerPiece ?? FALLBACK.piece.grams;
  return Math.max(1, Math.round(piece * amount));
}

function scaleFallback(
  amount: number,
  unit: FoodAmountUnit,
  grams: number,
): ManualFoodEstimate {
  if (unit === "piece") {
    return {
      grams,
      kcal: Math.round(FALLBACK.piece.kcal * amount),
      protein: round1(FALLBACK.piece.protein * amount),
      carbs: round1(FALLBACK.piece.carbs * amount),
      fat: round1(FALLBACK.piece.fat * amount),
      matched: null,
    };
  }
  const per100 = unit === "ml" ? FALLBACK.ml : FALLBACK.g;
  const factor = grams / 100;
  return {
    grams,
    kcal: Math.round(per100.kcal * factor),
    protein: round1(per100.protein * factor),
    carbs: round1(per100.carbs * factor),
    fat: round1(per100.fat * factor),
    matched: null,
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
