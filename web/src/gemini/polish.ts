import type { DailyAdvice } from "../domain/advice";
import { ADVICE_POLISH_PROMPT } from "./config";
import { generateGeminiText } from "./generate";

export async function polishAdviceDetails(
  advice: DailyAdvice,
  apiKey: string,
): Promise<DailyAdvice> {
  const payload = {
    diet: advice.diet.map((item) => ({
      action: item.action,
      target: item.target,
      reason: item.reason,
      detail: item.detail,
    })),
    training: {
      action: advice.training.action,
      title: advice.training.title,
      reason: advice.training.reason,
      detail: advice.training.detail,
    },
  };
  const text = await generateGeminiText(
    apiKey,
    [{ text: `${ADVICE_POLISH_PROMPT}\n输入：${JSON.stringify(payload)}` }],
    0.4,
  );
  const parsed = parsePolish(text);
  const diet = advice.diet.map((item, index) => {
    const next = clampDetail(parsed.dietDetails[index] ?? item.detail);
    return next ? { ...item, detail: next } : item;
  });
  const trainingDetail = clampDetail(parsed.trainingDetail) || advice.training.detail;
  return {
    ...advice,
    diet,
    training: { ...advice.training, detail: trainingDetail },
  };
}

function parsePolish(text: string): { dietDetails: string[]; trainingDetail: string } {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed: unknown = JSON.parse(trimmed);
  if (!parsed || typeof parsed !== "object") throw new Error("润色结果不是对象");
  const record = parsed as { dietDetails?: unknown; trainingDetail?: unknown };
  const dietDetails = Array.isArray(record.dietDetails)
    ? record.dietDetails.map((item) => String(item ?? "").trim())
    : [];
  return {
    dietDetails,
    trainingDetail: String(record.trainingDetail ?? "").trim(),
  };
}

function clampDetail(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length < 8) return "";
  return cleaned.slice(0, 180);
}
