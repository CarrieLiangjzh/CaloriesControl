import { clearFoodDraft, loadFoodDraft, saveFoodDraft } from "../data/foodDraftStore";
import { addFoodEntry, deleteFoodEntry, loadFoodDay } from "../data/foodStore";
import { loadGeminiKey } from "../data/geminiKeyStore";
import { loadProfile } from "../data/profileStore";
import { escapeHtml } from "../dom/escapeHtml";
import {
  defaultMealType,
  mealLabel,
  newFoodId,
  scaleNutrition,
  sumFood,
  type FoodDraft,
  type FoodEntry,
  type MealType,
} from "../domain/food";
import { analysisToDraft } from "../domain/foodAnalysis";
import { computeDailyTargets } from "../domain/goalMath";
import { localDateISO } from "../domain/shortcutSync";
import { isWeChatBrowser } from "../env/display";
import { analyzeFoodPhoto } from "../gemini/client";

const MAX_BYTES = 12 * 1024 * 1024;

export function renderFood(): string {
  const draft = loadFoodDraft();
  if (draft) return renderReview(draft);
  return renderDiary();
}

export function bindFood(root: HTMLElement): void {
  if (loadFoodDraft()) {
    bindReview(root);
    return;
  }
  bindDiary(root);
}

function renderDiary(): string {
  const entries = loadFoodDay();
  const totals = sumFood(entries);
  const hasKey = Boolean(loadGeminiKey());
  const list =
    entries.length === 0
      ? `<p>还没有记录。</p>`
      : `<ul class="food-list">${entries.map((entry) => foodRow(entry)).join("")}</ul>
         <p>今日已记 ${totals.kcal} kcal · 蛋白 ${totals.protein} g</p>`;

  return `
    <section class="page">
      <p class="eyebrow">饮食</p>
      <h1>拍照记一餐</h1>
      <p class="lead">拍完请核对名称和克数再保存。没有 Key 也可以手填。</p>
      ${isWeChatBrowser() ? `<p class="banner">请先在 Safari 打开再拍照。微信里相机经常不可用。</p>` : ""}
      ${hasKey ? "" : `<p>未填写 Gemini Key 时只能手填。到<a href="#/profile">我的</a>里粘贴 Key 后才能拍照识别。</p>`}
      <div class="row-actions">
        <label class="button">
          拍照
          <input id="food-camera" class="sr-only" type="file" accept="image/*" capture="environment" />
        </label>
        <label class="button secondary">
          相册
          <input id="food-album" class="sr-only" type="file" accept="image/*" />
        </label>
      </div>
      <p id="food-status" class="status" hidden></p>
      <article class="card">
        <h2>今日餐次</h2>
        ${list}
      </article>
      <form id="manual-food-form" class="stack">
        <h2>手填一餐</h2>
        <label class="field">
          <span>名称</span>
          <input name="name" type="text" maxlength="80" required placeholder="例如：鸡胸沙拉" />
        </label>
        <label class="field">
          <span>餐次</span>
          <select name="mealType">${mealOptions(defaultMealType())}</select>
        </label>
        <label class="field">
          <span>克数（可空）</span>
          <input name="grams" type="number" inputmode="decimal" min="1" max="5000" step="1" />
        </label>
        <label class="field">
          <span>热量 kcal</span>
          <input name="kcal" type="number" inputmode="decimal" min="0" max="5000" step="1" required />
        </label>
        <div class="macro-row">
          <label class="field">
            <span>蛋白 g</span>
            <input name="protein" type="number" inputmode="decimal" min="0" max="400" step="0.1" />
          </label>
          <label class="field">
            <span>碳水 g</span>
            <input name="carbs" type="number" inputmode="decimal" min="0" max="800" step="0.1" />
          </label>
          <label class="field">
            <span>脂肪 g</span>
            <input name="fat" type="number" inputmode="decimal" min="0" max="400" step="0.1" />
          </label>
        </div>
        <button type="submit" class="button">保存手填</button>
      </form>
    </section>
  `;
}

function renderReview(draft: FoodDraft): string {
  const scaled = scaleNutrition(draft, draft.grams);
  const warn =
    draft.confidence !== undefined && draft.confidence < 0.45
      ? `<p>把握较低（${Math.round(draft.confidence * 100)}%），请务必改克数或改用手填。</p>`
      : "";
  return `
    <section class="page">
      <p class="eyebrow">确认</p>
      <h1>核对后再保存</h1>
      <p class="lead">改克数时热量会按比例缩放。这不是医疗诊断。</p>
      ${warn}
      <form id="review-food-form" class="stack">
        <label class="field">
          <span>名称</span>
          <input name="name" type="text" maxlength="80" required value="${escapeHtml(draft.name)}" />
        </label>
        <label class="field">
          <span>餐次</span>
          <select name="mealType">${mealOptions(draft.mealType)}</select>
        </label>
        <label class="field">
          <span>克数</span>
          <input name="grams" type="number" inputmode="decimal" min="1" max="5000" step="1" required value="${draft.grams}" />
        </label>
        <article id="review-preview" class="card">${renderReviewPreview(draft.grams, scaled)}</article>
        <p id="review-status" class="status" hidden></p>
        <button type="submit" class="button">保存到今日</button>
        <button type="button" id="review-cancel" class="button secondary">取消</button>
      </form>
    </section>
  `;
}

function bindDiary(root: HTMLElement): void {
  const status = root.querySelector("#food-status");
  const camera = root.querySelector("#food-camera");
  const album = root.querySelector("#food-album");
  const onFile = (event: Event): void => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return;
    void analyzeFile(input.files[0], status);
    input.value = "";
  };
  if (camera instanceof HTMLInputElement) camera.addEventListener("change", onFile);
  if (album instanceof HTMLInputElement) album.addEventListener("change", onFile);

  root.querySelectorAll<HTMLButtonElement>("[data-delete-food]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.deleteFood;
      if (!id) return;
      if (!window.confirm("删除这一条？")) return;
      deleteFoodEntry(id);
      refreshFoodPage();
    });
  });

  const form = root.querySelector("#manual-food-form");
  if (!(form instanceof HTMLFormElement)) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const kcal = Number(data.get("kcal"));
    if (!name || !Number.isFinite(kcal) || kcal < 0) return;
    const gramsRaw = String(data.get("grams") ?? "").trim();
    const grams = gramsRaw ? Number(gramsRaw) : 100;
    addFoodEntry({
      id: newFoodId(),
      date: localDateISO(),
      mealType: asMealType(String(data.get("mealType"))),
      name,
      grams: Number.isFinite(grams) && grams > 0 ? grams : 100,
      kcal: Math.round(kcal),
      protein: Number(data.get("protein") || 0) || 0,
      carbs: Number(data.get("carbs") || 0) || 0,
      fat: Number(data.get("fat") || 0) || 0,
      source: "manual",
    });
    refreshFoodPage();
  });
}

function bindReview(root: HTMLElement): void {
  const draft = loadFoodDraft();
  if (!draft) return;
  const form = root.querySelector("#review-food-form");
  const preview = root.querySelector("#review-preview");
  const status = root.querySelector("#review-status");
  if (!(form instanceof HTMLFormElement)) return;

  const currentDraft = (): FoodDraft => {
    const data = new FormData(form);
    const grams = Number(data.get("grams"));
    return {
      ...draft,
      name: String(data.get("name") ?? draft.name).trim() || draft.name,
      mealType: asMealType(String(data.get("mealType"))),
      grams: Number.isFinite(grams) && grams > 0 ? grams : draft.grams,
    };
  };

  const refreshPreview = (): void => {
    const next = currentDraft();
    const scaled = scaleNutrition(draft, next.grams);
    if (preview instanceof HTMLElement) {
      preview.innerHTML = renderReviewPreview(next.grams, scaled);
    }
  };

  form.addEventListener("input", refreshPreview);
  form.addEventListener("change", refreshPreview);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const next = currentDraft();
    if (!next.name) {
      setStatus(status, "请填写名称。", false);
      return;
    }
    const scaled = scaleNutrition(draft, next.grams);
    addFoodEntry({
      id: newFoodId(),
      date: localDateISO(),
      mealType: next.mealType,
      name: next.name,
      grams: next.grams,
      kcal: scaled.kcal,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
      source: draft.source,
      confidence: draft.confidence,
    });
    clearFoodDraft();
    refreshFoodPage();
  });

  root.querySelector("#review-cancel")?.addEventListener("click", () => {
    clearFoodDraft();
    refreshFoodPage();
  });
}

async function analyzeFile(file: File, status: Element | null): Promise<void> {
  if (file.size > MAX_BYTES) {
    setStatus(status, "图片太大，请换一张。", false);
    return;
  }
  setStatus(status, "正在识别…", true);
  try {
    const analysis = await analyzeFoodPhoto(file, loadGeminiKey());
    saveFoodDraft(analysisToDraft(analysis, defaultMealType()));
    refreshFoodPage();
  } catch (error) {
    const message = error instanceof Error ? error.message : "识别失败";
    setStatus(status, message, false);
  }
}

function renderReviewPreview(
  grams: number,
  scaled: ReturnType<typeof scaleNutrition>,
): string {
  const profile = loadProfile();
  const eaten = sumFood(loadFoodDay()).kcal;
  let whatIf = "填资料后可预览对今日目标的影响。";
  if (profile) {
    const target = computeDailyTargets(profile).targetKcal;
    const remaining = target - eaten - scaled.kcal;
    whatIf =
      remaining >= 0
        ? `记下后今日还剩 ${remaining} kcal（目标 ${target}，已吃 ${eaten}）。`
        : `记下后会超过目标 ${Math.abs(remaining)} kcal（目标 ${target}，已吃 ${eaten}）。`;
  }
  return `
    <h2>营养</h2>
    <dl class="kv">
      <dt>热量</dt><dd>${scaled.kcal} kcal / ${grams} g</dd>
      <dt>蛋白</dt><dd>${scaled.protein} g</dd>
      <dt>碳水</dt><dd>${scaled.carbs} g</dd>
      <dt>脂肪</dt><dd>${scaled.fat} g</dd>
    </dl>
    <p>${whatIf}</p>
  `;
}

function foodRow(entry: FoodEntry): string {
  const source = entry.source === "photo" ? "拍照" : "手填";
  return `
    <li>
      <div>
        <strong>${escapeHtml(entry.name)}</strong>
        <span>${mealLabel(entry.mealType)} · ${entry.kcal} kcal · ${entry.grams} g · ${source}</span>
      </div>
      <button type="button" class="text-button" data-delete-food="${entry.id}">删除</button>
    </li>
  `;
}

function mealOptions(selected: MealType): string {
  const types: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
  return types
    .map(
      (type) =>
        `<option value="${type}" ${type === selected ? "selected" : ""}>${mealLabel(type)}</option>`,
    )
    .join("");
}

function asMealType(value: string): MealType {
  if (value === "breakfast" || value === "lunch" || value === "dinner" || value === "snack") {
    return value;
  }
  return defaultMealType();
}

function refreshFoodPage(): void {
  if (window.location.hash === "#/food") {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  window.location.hash = "#/food";
}

function setStatus(node: Element | null, text: string, ok: boolean): void {
  if (!(node instanceof HTMLElement)) return;
  node.hidden = false;
  node.textContent = text;
  node.classList.toggle("ok", ok);
}
