import { geminiKeyHint, loadGeminiKey, saveGeminiKey } from "../data/geminiKeyStore";
import { loadProfile, saveProfile } from "../data/profileStore";
import { escapeHtml } from "../dom/escapeHtml";
import { computeDailyTargets, goalLabel } from "../domain/goalMath";
import type { Profile } from "../domain/types";
import { validateProfile } from "../domain/validateProfile";
import { isStandaloneDisplay, isWeChatBrowser } from "../env/display";

export function renderProfile(): string {
  const profile = loadProfile();
  return `
    <section class="page">
      <p class="eyebrow">我的</p>
      <h1>个人资料</h1>
      <p class="lead">算今日热量和蛋白目标。数据只存在这台手机的浏览器里。</p>
      <form id="profile-form" class="stack" novalidate>
        <fieldset class="card">
          <legend>性别</legend>
          <div class="choices">
            ${radio("sex", "male", "男", profile?.sex === "male")}
            ${radio("sex", "female", "女", profile?.sex === "female")}
          </div>
          <p class="field-error" data-error-for="sex"></p>
        </fieldset>

        <label class="field">
          <span>年龄</span>
          <input name="age" type="number" inputmode="numeric" min="14" max="80" step="1" value="${attr(profile?.age)}" required />
          <p class="field-error" data-error-for="age"></p>
        </label>

        <label class="field">
          <span>身高（厘米）</span>
          <input name="heightCm" type="number" inputmode="decimal" min="120" max="220" step="0.1" value="${attr(profile?.heightCm)}" required />
          <p class="field-error" data-error-for="heightCm"></p>
        </label>

        <label class="field">
          <span>当前体重（公斤）</span>
          <input name="weightKg" type="number" inputmode="decimal" min="30" max="250" step="0.1" value="${attr(profile?.weightKg)}" required />
          <p class="field-error" data-error-for="weightKg"></p>
        </label>

        <label class="field">
          <span>目标体重（公斤）</span>
          <input name="targetWeightKg" type="number" inputmode="decimal" min="30" max="250" step="0.1" value="${attr(profile?.targetWeightKg)}" required />
          <p class="field-error" data-error-for="targetWeightKg"></p>
        </label>

        <fieldset class="card">
          <legend>目标</legend>
          <div class="choices">
            ${radio("goal", "lose", "减脂", profile?.goal === "lose")}
            ${radio("goal", "gain", "增肌", profile?.goal === "gain")}
            ${radio("goal", "maintain", "维持", profile?.goal === "maintain")}
          </div>
          <p class="field-error" data-error-for="goal"></p>
        </fieldset>

        <label class="field">
          <span>活动水平</span>
          <select name="activityLevel" required>
            <option value="">请选择</option>
            ${activityOptions(profile?.activityLevel)}
          </select>
          <p class="field-error" data-error-for="activityLevel"></p>
        </label>

        <label class="field">
          <span>体脂率 %（选填，填写则改用 Katch 公式）</span>
          <input name="bodyFatPercent" type="number" inputmode="decimal" min="5" max="50" step="0.1" value="${attr(profile?.bodyFatPercent)}" />
          <p class="field-error" data-error-for="bodyFatPercent"></p>
        </label>

        <article id="goal-preview" class="card muted"></article>
        <p id="profile-status" class="status" hidden></p>
        <button type="submit" class="button">保存资料</button>
      </form>
      <form id="gemini-key-form" class="stack">
        <h2>Gemini API Key</h2>
        <p>${loadGeminiKey() ? escapeHtml(geminiKeyHint()) : "拍照识别需要自己的 Key。在 Google AI Studio 创建后粘贴到这里，只存在本机。本站使用 Gemini 3.5 Flash。"}</p>
        <label class="field">
          <span>API Key</span>
          <input name="apiKey" type="password" autocomplete="off" spellcheck="false" placeholder="${loadGeminiKey() ? "已保存，留空再保存则不改" : "粘贴 Key"}" />
        </label>
        <p id="gemini-key-status" class="status" hidden></p>
        <div class="row-actions">
          <button type="submit" class="button">保存 Key</button>
          <button type="button" id="gemini-key-clear" class="button secondary">清除 Key</button>
        </div>
      </form>
      <article class="card muted">
        <h2>加到主屏幕</h2>
        <p>${
          isWeChatBrowser()
            ? "请先点右上角 ··· → 在 Safari 打开，再用分享 → 添加到主屏幕。"
            : isStandaloneDisplay()
              ? "已经是主屏幕图标打开，日常请继续用这个入口。"
              : "用 Safari 打开本页 → 分享 → 添加到主屏幕，名称「热量控制」。不要用微信内打开。"
        }</p>
      </article>
      <p><a href="#/sync">安装「热量控制-同步今日消耗」快捷指令</a></p>
    </section>
  `;
}

export function bindProfile(root: HTMLElement): void {
  const form = root.querySelector("#profile-form");
  if (!(form instanceof HTMLFormElement)) return;
  const preview = root.querySelector("#goal-preview");
  const status = root.querySelector("#profile-status");

  const refreshPreview = (): void => {
    clearErrors(form);
    const result = validateProfile(formValues(form));
    if (preview instanceof HTMLElement) {
      preview.innerHTML = result.ok
        ? renderPreview(result.profile)
        : `<h2>目标预览</h2><p>填完必填项后会显示热量和蛋白。</p>`;
    }
  };

  form.addEventListener("input", refreshPreview);
  form.addEventListener("change", refreshPreview);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors(form);
    const result = validateProfile(formValues(form));
    if (!result.ok) {
      showErrors(form, result.errors);
      setStatus(status, "请先改完标红的项。", false);
      return;
    }
    saveProfile(result.profile);
    if (preview instanceof HTMLElement) {
      preview.innerHTML = renderPreview(result.profile);
    }
    setStatus(status, "已保存。可到「今日」查看目标。", true);
  });

  refreshPreview();
  bindGeminiKey(root);
}

function bindGeminiKey(root: HTMLElement): void {
  const form = root.querySelector("#gemini-key-form");
  const status = root.querySelector("#gemini-key-status");
  if (!(form instanceof HTMLFormElement)) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const key = String(data.get("apiKey") ?? "").trim();
    if (!key) {
      if (loadGeminiKey()) {
        setStatus(status, "Key 未改。", true);
        return;
      }
      setStatus(status, "请粘贴 Key。", false);
      return;
    }
    saveGeminiKey(key);
    const input = form.querySelector('input[name="apiKey"]');
    if (input instanceof HTMLInputElement) input.value = "";
    const intro = form.querySelector("h2 + p");
    if (intro) intro.textContent = geminiKeyHint();
    setStatus(status, "Key 已保存。", true);
  });
  root.querySelector("#gemini-key-clear")?.addEventListener("click", () => {
    saveGeminiKey("");
    const input = form.querySelector('input[name="apiKey"]');
    if (input instanceof HTMLInputElement) input.value = "";
    const intro = form.querySelector("h2 + p");
    if (intro) intro.textContent = "拍照识别需要自己的 Key。在 Google AI Studio 创建后粘贴到这里，只存在本机。";
    setStatus(status, "已清除 Key。拍照识别不可用，仍可手填。", true);
  });
}

function renderPreview(profile: Profile): string {
  const targets = computeDailyTargets(profile);
  const notes: string[] = [];
  if (targets.forcedMaintainBecauseMinor) {
    notes.push("未满 18 岁，热量按维持计算，不做减脂或增肌盈余。");
  }
  if (targets.usedAdultSafetyFloor) {
    notes.push("减脂热量已抬到安全下限，避免吃得过少。");
  }
  return `
    <h2>目标预览（${goalLabel(profile.goal)}）</h2>
    <dl class="kv">
      <dt>公式</dt><dd>${targets.formula === "katch" ? "Katch-McArdle" : "Mifflin-St Jeor"}</dd>
      <dt>BMR</dt><dd>${targets.bmr} kcal</dd>
      <dt>TDEE</dt><dd>${targets.tdee} kcal</dd>
      <dt>每日热量</dt><dd>${targets.targetKcal} kcal</dd>
      <dt>蛋白</dt><dd>${targets.proteinG} g</dd>
      <dt>碳水</dt><dd>${targets.carbsG} g</dd>
      <dt>脂肪</dt><dd>${targets.fatG} g</dd>
    </dl>
    ${notes.map((note) => `<p>${note}</p>`).join("")}
  `;
}

function formValues(form: HTMLFormElement): Record<string, string> {
  const data = new FormData(form);
  const values: Record<string, string> = {};
  for (const [key, value] of data.entries()) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

function showErrors(form: HTMLFormElement, errors: Record<string, string>): void {
  for (const [field, message] of Object.entries(errors)) {
    const node = form.querySelector(`[data-error-for="${field}"]`);
    if (node) node.textContent = message;
  }
}

function clearErrors(form: HTMLFormElement): void {
  form.querySelectorAll("[data-error-for]").forEach((node) => {
    node.textContent = "";
  });
}

function setStatus(node: Element | null, text: string, ok: boolean): void {
  if (!(node instanceof HTMLElement)) return;
  node.hidden = false;
  node.textContent = text;
  node.classList.toggle("ok", ok);
}

function radio(name: string, value: string, label: string, checked: boolean): string {
  return `
    <label class="choice">
      <input type="radio" name="${name}" value="${value}" ${checked ? "checked" : ""} />
      ${label}
    </label>
  `;
}

function activityOptions(selected: string | undefined): string {
  const items: [string, string][] = [
    ["sedentary", "久坐（很少运动）"],
    ["light", "轻度（每周 1–3 次）"],
    ["moderate", "中度（每周 3–5 次）"],
    ["active", "活跃（每周 6–7 次）"],
    ["veryActive", "很活跃（每天训练）"],
    ["extraActive", "额外活跃（体力活 + 训练）"],
  ];
  return items
    .map(
      ([value, label]) =>
        `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function attr(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}
