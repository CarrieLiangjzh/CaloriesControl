import { saveHealthDay } from "../data/healthStore";
import { escapeHtml } from "../dom/escapeHtml";
import {
  callbackBaseUrl,
  parseSyncParams,
  syncErrorMessage,
} from "../domain/shortcutSync";
import { renderShortcutGuide } from "./shortcutGuide";

export function renderSync(params: URLSearchParams): string {
  const hasPayload = Boolean(
    params.get("activeKcal") || params.get("date") || params.get("workouts"),
  );

  if (!hasPayload) {
    return `
      <section class="page">
        <p class="eyebrow">同步</p>
        <h1>手表消耗</h1>
        <p class="lead">健康数据只经系统快捷指令进入本页。失败时请手填健身 App 活动环上的千卡。</p>
        ${renderShortcutGuide(escapeHtml(callbackBaseUrl()))}
        <p><a href="#/today">返回今日</a></p>
      </section>
    `;
  }

  const parsed = parseSyncParams(params);
  if (parsed.ok) {
    return `
      <section class="page">
        <p class="eyebrow">同步</p>
        <h1>已写入 ${parsed.snapshot.activeKcal} kcal</h1>
        <p class="lead">正在回到今日…</p>
        <p><a href="#/today">若没有跳转，点这里</a></p>
      </section>
    `;
  }

  return `
    <section class="page">
      <p class="eyebrow">同步</p>
      <h1>没有写入</h1>
      <p class="lead">${escapeHtml(syncErrorMessage(parsed.error))}</p>
      <p><a class="button" href="#/today">去手填</a></p>
    </section>
  `;
}

export function bindSync(params: URLSearchParams): void {
  const hasPayload = Boolean(
    params.get("activeKcal") || params.get("date") || params.get("workouts"),
  );
  if (!hasPayload) return;
  const parsed = parseSyncParams(params);
  if (!parsed.ok) return;
  saveHealthDay(parsed.snapshot);
  window.location.replace("#/today");
}
