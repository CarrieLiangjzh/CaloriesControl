import { loadHealthDay, saveHealthDay } from "../data/healthStore";
import { loadProfile } from "../data/profileStore";
import { escapeHtml } from "../dom/escapeHtml";
import {
  dietActionLabel,
  trainingActionLabel,
  type DailyAdvice,
  type DietAdvice,
} from "../domain/advice";
import { computeDailyTargets, goalLabel, sexLabel } from "../domain/goalMath";
import {
  callbackBaseUrl,
  localDateISO,
  runShortcutHref,
  type HealthDayCache,
  type WorkoutSnapshot,
} from "../domain/shortcutSync";
import { isStandaloneDisplay, isWeChatBrowser } from "../env/display";
import { renderShortcutGuide } from "./shortcutGuide";
import { maybePolishAdvice, resolveTodayAdvice } from "./todayAdvice";

export function renderToday(): string {
  const profile = loadProfile();
  if (!profile) {
    return `
      <section class="page">
        <p class="eyebrow">今日</p>
        <h1>先填个人资料</h1>
        <p class="lead">有年龄、性别、身高体重和目标之后，才能算出今天该吃多少。</p>
        <p><a class="button" href="#/profile">去填写</a></p>
      </section>
    `;
  }

  const targets = computeDailyTargets(profile);
  const health = loadHealthDay();
  const resolved = resolveTodayAdvice();
  const advice = resolved?.advice;
  const foodKcal = advice?.numbers.foodKcal ?? 0;
  const proteinG = advice?.numbers.proteinG ?? 0;
  const remaining = targets.targetKcal - foodKcal;
  const remainingText = remaining >= 0 ? `还剩 ${remaining} kcal` : `已超 ${Math.abs(remaining)} kcal`;
  const minorNote = targets.forcedMaintainBecauseMinor
    ? `<p>未满 18 岁，热量按维持计算。</p>`
    : "";
  const floorNote = targets.usedAdultSafetyFloor
    ? `<p>减脂热量已使用安全下限。</p>`
    : "";

  return `
    <section class="page">
      <p class="eyebrow">今日</p>
      <h1>${targets.targetKcal} kcal</h1>
      <p class="lead">${sexLabel(profile.sex)} · ${profile.age} 岁 · ${goalLabel(profile.goal)} · ${remainingText}</p>
      ${installHint()}
      <div class="cards">
        <article class="card">
          <h2>热量目标</h2>
          <dl class="kv">
            <dt>今日目标</dt><dd>${targets.targetKcal}</dd>
            <dt>已吃</dt><dd>${foodKcal} kcal · 蛋白 ${proteinG} g</dd>
            <dt>手表消耗</dt><dd>${health ? `${health.activeKcal} kcal` : "尚未同步"}</dd>
            <dt>宏量</dt><dd>蛋白 ${targets.proteinG} · 碳水 ${targets.carbsG} · 脂肪 ${targets.fatG} g</dd>
          </dl>
          ${minorNote}${floorNote}
          <p>手表消耗只作参考，目标仍按资料里的活动水平计算，避免和 TDEE 重复计算。</p>
        </article>
        ${advice ? renderAdvice(advice, Boolean(resolved?.polished)) : ""}
        ${renderWatchCard(health)}
        <details class="card muted">
          <summary>如何安装「同步今日消耗」</summary>
          ${renderShortcutGuide(escapeHtml(callbackBaseUrl()))}
        </details>
      </div>
    </section>
  `;
}

export function bindToday(root: HTMLElement): void {
  const resolved = resolveTodayAdvice();
  if (resolved) maybePolishAdvice(resolved);

  const form = root.querySelector("#manual-health-form");
  if (!(form instanceof HTMLFormElement)) return;
  const status = root.querySelector("#manual-health-status");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const kcal = Number(String(data.get("activeKcal") ?? "").trim());
    if (!Number.isFinite(kcal) || kcal < 0 || kcal > 20000) {
      setStatus(status, "请填写 0–20000 之间的千卡数字。", false);
      return;
    }
    const note = String(data.get("workoutNote") ?? "").trim();
    const workouts: WorkoutSnapshot[] = note
      ? [{ type: "manual", note }]
      : [];
    const snapshot: HealthDayCache = {
      date: localDateISO(),
      activeKcal: Math.round(kcal),
      workouts,
      source: "manual",
      fetchedAt: new Date().toISOString(),
    };
    saveHealthDay(snapshot);
    refreshToday();
  });
}

function renderAdvice(advice: DailyAdvice, polished: boolean): string {
  const diet = advice.diet
    .map((item) => dietCard(item))
    .join("");
  const tone = advice.training.action === "rest" || advice.training.action === "shorten" ? "warn" : "";
  return `
    <article class="card">
      <h2>今天怎么吃、怎么练</h2>
      <p class="fine">规则先出指令。有 Key 时只润色句子，不改动作。${polished ? "已润色。" : ""}</p>
      <div class="advice-list">
        ${diet}
        <article class="advice">
          <p><span class="pill ${tone}">${escapeHtml(trainingActionLabel(advice.training.action))}</span></p>
          <h3>${escapeHtml(advice.training.title)}</h3>
          <p>${escapeHtml(advice.training.detail)}</p>
          <p><a href="#/workout">打开本周清单</a></p>
        </article>
      </div>
      <p class="fine">估算，不是医疗建议。运动中请用手表上的系统健身。</p>
    </article>
  `;
}

function dietCard(item: DietAdvice): string {
  const tone = item.action === "increase" ? "" : "warn";
  return `
    <article class="advice">
      <p><span class="pill ${tone}">${escapeHtml(dietActionLabel(item.action))}</span> ${escapeHtml(item.target)}</p>
      <p>${escapeHtml(item.detail)}</p>
      <p><a href="#/food">去记一餐</a></p>
    </article>
  `;
}

function installHint(): string {
  if (isWeChatBrowser()) {
    return `<p class="banner">请用 Safari 打开（微信右上角 ··· → 在 Safari 打开），再添加到主屏幕。微信里相机和存储不可靠。</p>`;
  }
  if (isStandaloneDisplay()) return "";
  return `<p class="fine">日常请用 Safari「分享 → 添加到主屏幕」后的图标打开，建议和同步更稳。</p>`;
}

function renderWatchCard(health: HealthDayCache | null): string {
  const ios = typeof navigator !== "undefined" && isAppleMobile();
  const syncHref = ios ? runShortcutHref() : "#/sync";
  const syncHint = ios
    ? "会打开快捷指令读取健康。请把指令最后一步改成「停止并输出」数字，本页会把你带回来。"
    : "请在 iPhone 的 Safari 里点同步。电脑上可手填，或打开同步页查看安装步骤。";
  const sourceLabel =
    health?.source === "shortcut"
      ? "来自快捷指令"
      : health?.source === "manual"
        ? "来自手填"
        : "";
  const workoutLines = (health?.workouts ?? [])
    .map((item) => workoutLine(item))
    .join("");

  return `
    <article class="card">
      <h2>手表</h2>
      <p>${health ? `${health.activeKcal} kcal · ${sourceLabel}` : "还没有今天的消耗。同步失败时对照健身 App 活动环手填，建议仍会出。"}</p>
      ${workoutLines ? `<ul class="plain">${workoutLines}</ul>` : ""}
      <p>${syncHint}</p>
      <p><a class="button" data-run-shortcut href="${syncHref}">同步手表</a></p>
      <form id="manual-health-form" class="stack">
        <label class="field">
          <span>手填今日消耗（千卡，看健身活动环）</span>
          <input name="activeKcal" type="number" inputmode="decimal" min="0" max="20000" step="1" required value="${health ? health.activeKcal : ""}" />
        </label>
        <label class="field">
          <span>今日锻炼（选填）</span>
          <input name="workoutNote" type="text" maxlength="80" placeholder="例如：已跑步 30 分钟" value="${escapeHtml(manualNote(health))}" />
        </label>
        <p id="manual-health-status" class="status" hidden></p>
        <button type="submit" class="button">保存手填</button>
      </form>
    </article>
  `;
}

function workoutLine(item: WorkoutSnapshot): string {
  const bits = [item.type];
  if (item.minutes !== undefined) bits.push(`${item.minutes} 分钟`);
  if (item.kcal !== undefined) bits.push(`${item.kcal} kcal`);
  if (item.note) bits.push(item.note);
  return `<li>${escapeHtml(bits.join(" · "))}</li>`;
}

function manualNote(health: HealthDayCache | null): string {
  const manual = health?.workouts.find((item) => item.type === "manual" && item.note);
  return manual?.note ?? "";
}

function isAppleMobile(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function refreshToday(): void {
  if (window.location.hash === "#/today" || window.location.hash === "") {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  window.location.hash = "#/today";
}

function setStatus(node: Element | null, text: string, ok: boolean): void {
  if (!(node instanceof HTMLElement)) return;
  node.hidden = false;
  node.textContent = text;
  node.classList.toggle("ok", ok);
}
