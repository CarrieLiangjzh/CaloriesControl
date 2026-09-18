import type { FoodDraft } from "../domain/food";

const DRAFT_KEY = "calories-control:food-draft:v1";

export function loadFoodDraft(): FoodDraft | null {
  const raw = window.sessionStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as FoodDraft;
  } catch {
    return null;
  }
}

export function saveFoodDraft(draft: FoodDraft): void {
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearFoodDraft(): void {
  window.sessionStorage.removeItem(DRAFT_KEY);
}
