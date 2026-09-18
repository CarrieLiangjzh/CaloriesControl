import type { Profile } from "../domain/types";
import { validateProfile } from "../domain/validateProfile";

export const PROFILE_KEY = "calories-control:profile:v1";

export function loadProfile(): Profile | null {
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const result = validateProfile(parsed as Record<string, unknown>);
    return result.ok ? result.profile : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
