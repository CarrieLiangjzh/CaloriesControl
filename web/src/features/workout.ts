import { loadHealthDay } from "../data/healthStore";
import { loadProfile } from "../data/profileStore";
import { loadWeekPlan, togglePlanItem } from "../data/workoutPlanStore";
import { escapeHtml } from "../dom/escapeHtml";
import { trainingActionLabel } from "../domain/advice";
import type { WorkoutSnapshot } from "../domain/shortcutSync";
import {
  itemStatus,
  planDayForDate,
  statusLabel,
  templateLabel,
  type PlanDay,
} from "../domain/workoutPlan";
import { resolveTodayAdvice } from "./todayAdvice";

const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function renderWorkout(): string {
  const profile = loadProfile();
  if (!profile) {
    return `
      <section class="page">
        <p class="eyebrow">训练</p>
        <h1>先填个人资料</h1>
        <p class="lead">目标类型决定用哪套周模板。</p>
        <p><a class="button" href="#/profile">去填写</a></p>
      </section>
    `;
  }

  const { plan, checked } = loadWeekPlan(profile.goal);
  const today = planDayForDate(plan);
  const health = loadHealthDay();
  const workouts = health?.workouts ?? [];
  const advice = resolveTodayAdvice()?.advice.training;
  const week = plan.days
    .slice()
    .sort((a, b) => order(a.weekday) - order(b.weekday))
    .map((day) => renderDay(day, today?.weekday === day.weekday, checked, workouts))
    .join("");

  return `
    <section class="page">
      <p class="eyebrow">训练</p>
      <h1>${escapeHtml(templateLabel(plan.templateId))}</h1>
      <p class="lead">网页只给清单和是否休息。跑步、心率请用手表上的系统「健身」开始。</p>
      ${
        advice
          ? `<article class="card">
              <h2>${escapeHtml(trainingActionLabel(advice.action))} · ${escapeHtml(advice.title)}</h2>
              <p>${escapeHtml(advice.detail)}</p>
            </article>`
          : ""
      }
      <div class="cards">
        ${week}
      </div>
    </section>
  `;
}

export function bindWorkout(root: HTMLElement): void {
  const profile = loadProfile();
  if (!profile) return;
  root.querySelectorAll<HTMLInputElement>("[data-plan-item]").forEach((input) => {
    input.addEventListener("change", () => {
      const id = input.dataset.planItem;
      if (!id || input.disabled) return;
      togglePlanItem(profile.goal, id);
      refreshWorkout();
    });
  });
}

function renderDay(
  day: PlanDay,
  isToday: boolean,
  checked: Record<string, boolean>,
  workouts: WorkoutSnapshot[],
): string {
  const items = day.items
    .map((item) => {
      const status = itemStatus(item, Boolean(checked[item.id]), workouts);
      const synced = status === "synced";
      const done = status === "done" || synced;
      const hint = statusLabel(status);
      return `
        <li class="${synced ? "synced" : ""}">
          <label>
            <input type="checkbox" data-plan-item="${item.id}" ${done ? "checked" : ""} ${synced ? "disabled" : ""} />
            <span>
              <strong>${escapeHtml(item.name)}</strong>
              <span>${item.minutes ? `${item.minutes} 分钟` : "休息"}${hint ? ` · ${hint}` : ""}</span>
            </span>
          </label>
        </li>
      `;
    })
    .join("");
  return `
    <article class="card ${isToday ? "" : "muted"}">
      <h2>${isToday ? "今天 · " : ""}${WEEKDAY_LABELS[day.weekday]} ${escapeHtml(day.title)}</h2>
      <ul class="checklist">${items}</ul>
    </article>
  `;
}

function order(weekday: number): number {
  return weekday === 0 ? 7 : weekday;
}

function refreshWorkout(): void {
  if (window.location.hash === "#/workout") {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  window.location.hash = "#/workout";
}
