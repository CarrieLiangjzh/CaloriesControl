import type { DailyAdvice } from "../domain/advice";
import { localDateISO } from "../domain/shortcutSync";

export const ADVICE_SNAPSHOT_KEY = "calories-control:advice-snapshot:v1";

export type AdviceSnapshot = {
  date: string;
  fingerprint: string;
  generatedAt: string;
  engineVersion: string;
  advice: DailyAdvice;
  polished: boolean;
};

export function loadAdviceSnapshot(date = localDateISO()): AdviceSnapshot | null {
  const raw = window.localStorage.getItem(ADVICE_SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as AdviceSnapshot;
    if (record.date !== date) return null;
    return record;
  } catch {
    return null;
  }
}

export function saveAdviceSnapshot(snapshot: AdviceSnapshot): void {
  window.localStorage.setItem(ADVICE_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export function clearAdviceSnapshot(): void {
  window.localStorage.removeItem(ADVICE_SNAPSHOT_KEY);
}
