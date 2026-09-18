import type { FoodEntry } from "../domain/food";
import { localDateISO } from "../domain/shortcutSync";

export const FOOD_DAYS_KEY = "calories-control:food-days:v1";
const KEEP_DAYS = 21;

type DayMap = Record<string, FoodEntry[]>;

export function loadFoodDay(date = localDateISO()): FoodEntry[] {
  return readAll()[date] ?? [];
}

export function addFoodEntry(entry: FoodEntry): void {
  const all = readAll();
  const list = all[entry.date] ?? [];
  all[entry.date] = [...list, entry];
  writeAll(prune(all, entry.date));
}

export function deleteFoodEntry(id: string, date = localDateISO()): void {
  const all = readAll();
  all[date] = (all[date] ?? []).filter((item) => item.id !== id);
  writeAll(all);
}

function readAll(): DayMap {
  const raw = window.localStorage.getItem(FOOD_DAYS_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as DayMap;
  } catch {
    return {};
  }
}

function writeAll(all: DayMap): void {
  window.localStorage.setItem(FOOD_DAYS_KEY, JSON.stringify(all));
}

function prune(all: DayMap, keepDate: string): DayMap {
  const dates = Object.keys(all).sort();
  if (dates.length <= KEEP_DAYS) return all;
  const next: DayMap = {};
  for (const date of dates.slice(-KEEP_DAYS)) {
    next[date] = all[date];
  }
  if (all[keepDate]) next[keepDate] = all[keepDate];
  return next;
}
