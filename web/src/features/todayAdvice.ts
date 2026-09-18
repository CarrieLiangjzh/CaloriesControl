import { loadAdviceSnapshot, saveAdviceSnapshot } from "../data/adviceStore";
import { loadFoodDay } from "../data/foodStore";
import { loadGeminiKey } from "../data/geminiKeyStore";
import { loadHealthDay, loadRecentDayLoads } from "../data/healthStore";
import { loadProfile } from "../data/profileStore";
import { loadWeekPlan } from "../data/workoutPlanStore";
import type { DailyAdvice, DailyContext, PlannedToday } from "../domain/advice";
import { ADVICE_ENGINE_VERSION } from "../domain/adviceConfig";
import { adviceFingerprint, computeAdvice } from "../domain/adviceEngine";
import { sumFood } from "../domain/food";
import { computeDailyTargets } from "../domain/goalMath";
import { localDateISO } from "../domain/shortcutSync";
import { itemStatus, planDayForDate } from "../domain/workoutPlan";
import { polishAdviceDetails } from "../gemini/polish";

export type ResolvedAdvice = {
  advice: DailyAdvice;
  fingerprint: string;
  polished: boolean;
};

export function loadDailyContext(now = new Date()): DailyContext | null {
  const profile = loadProfile();
  if (!profile) return null;
  const health = loadHealthDay();
  const { plan, checked } = loadWeekPlan(profile.goal, now);
  const todayPlan = planDayForDate(plan, now);
  const workouts = health?.workouts ?? [];
  const plannedToday: PlannedToday | null = todayPlan
    ? {
        title: todayPlan.title,
        items: todayPlan.items
          .filter((item) => item.kind !== "rest")
          .map((item) => {
            const status = itemStatus(item, Boolean(checked[item.id]), workouts);
            return {
              name: item.name,
              kind: item.kind === "rest" ? "other" : item.kind,
              minutes: item.minutes,
              done: status === "done",
              synced: status === "synced",
            };
          }),
      }
    : null;
  return {
    profile,
    targets: computeDailyTargets(profile),
    food: sumFood(loadFoodDay()),
    health,
    recentDays: loadRecentDayLoads(localDateISO(now)),
    now,
    plannedToday,
  };
}

export function resolveTodayAdvice(now = new Date()): ResolvedAdvice | null {
  const context = loadDailyContext(now);
  if (!context) return null;
  const fingerprint = adviceFingerprint(context);
  const cached = loadAdviceSnapshot(localDateISO(now));
  if (cached && cached.fingerprint === fingerprint) {
    return { advice: cached.advice, fingerprint, polished: cached.polished };
  }
  const advice = computeAdvice(context);
  saveAdviceSnapshot({
    date: localDateISO(now),
    fingerprint,
    generatedAt: now.toISOString(),
    engineVersion: ADVICE_ENGINE_VERSION,
    advice,
    polished: false,
  });
  return { advice, fingerprint, polished: false };
}

let polishInFlight: string | null = null;

export function maybePolishAdvice(resolved: ResolvedAdvice): void {
  if (resolved.polished) return;
  const key = loadGeminiKey();
  if (!key) return;
  if (polishInFlight === resolved.fingerprint) return;
  polishInFlight = resolved.fingerprint;
  void polishAdviceDetails(resolved.advice, key)
    .then((polished) => {
      const latest = resolveTodayAdvice();
      if (!latest || latest.fingerprint !== resolved.fingerprint) return;
      const merged: DailyAdvice = {
        ...latest.advice,
        diet: latest.advice.diet.map((item, index) => ({
          ...item,
          detail: polished.diet[index]?.detail || item.detail,
        })),
        training: {
          ...latest.advice.training,
          detail: polished.training.detail || latest.advice.training.detail,
        },
      };
      saveAdviceSnapshot({
        date: localDateISO(),
        fingerprint: resolved.fingerprint,
        generatedAt: new Date().toISOString(),
        engineVersion: ADVICE_ENGINE_VERSION,
        advice: merged,
        polished: true,
      });
      if (window.location.hash === "#/today" || window.location.hash === "") {
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }
    })
    .catch(() => {
      /* keep rule text */
    })
    .finally(() => {
      if (polishInFlight === resolved.fingerprint) polishInFlight = null;
    });
}
