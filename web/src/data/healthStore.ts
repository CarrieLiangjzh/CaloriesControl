import type { DayLoad } from "../domain/advice";
import type { HealthDayCache } from "../domain/shortcutSync";
import { localDateISO, shiftLocalDateISO } from "../domain/shortcutSync";

export const HEALTH_DAYS_KEY = "calories-control:health-days:v1";
const KEEP_DAYS = 21;

type DayMap = Record<string, HealthDayCache>;

export function loadHealthDay(date = localDateISO()): HealthDayCache | null {
  return readAll()[date] ?? null;
}

export function loadRecentDayLoads(today = localDateISO()): DayLoad[] {
  return [-2, -1, 0].map((offset) => {
    const date = shiftLocalDateISO(today, offset);
    const snapshot = readAll()[date];
    return {
      date,
      activeKcal: snapshot?.activeKcal ?? 0,
      workouts: snapshot?.workouts ?? [],
    };
  });
}

export function saveHealthDay(snapshot: HealthDayCache): void {
  const all = readAll();
  all[snapshot.date] = snapshot;
  writeAll(prune(all, snapshot.date));
}

function readAll(): DayMap {
  const raw = window.localStorage.getItem(HEALTH_DAYS_KEY);
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
  window.localStorage.setItem(HEALTH_DAYS_KEY, JSON.stringify(all));
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
