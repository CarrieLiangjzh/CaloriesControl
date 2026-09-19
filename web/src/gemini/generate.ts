import { GEMINI_MODELS } from "./config";

export type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };

export async function generateGeminiText(
  apiKey: string,
  parts: GeminiPart[],
  temperature = 0.2,
): Promise<string> {
  if (!apiKey) throw new Error("还没有填写 Gemini API Key。");
  let lastError = "识别失败。";
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
        },
      }),
    });
    if (response.ok) {
      return extractText(await response.json());
    }
    lastError = await geminiErrorMessage(response);
    if (!shouldTryNextModel(response.status, lastError)) {
      throw new Error(lastError);
    }
  }
  throw new Error(lastError);
}

function shouldTryNextModel(status: number, message: string): boolean {
  if (status === 429) return false;
  const lower = message.toLowerCase();
  return (
    status === 404 ||
    lower.includes("not found") ||
    lower.includes("not supported") ||
    lower.includes("not available") ||
    lower.includes("不支持")
  );
}

export function extractText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    throw new Error("识别接口没有返回内容");
  }
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || !candidates[0] || typeof candidates[0] !== "object") {
    throw new Error("识别接口没有候选结果");
  }
  const content = (candidates[0] as { content?: { parts?: unknown } }).content;
  const parts = content?.parts;
  if (!Array.isArray(parts)) throw new Error("识别结果为空");
  const texts = parts
    .map((part) =>
      part && typeof part === "object" && "text" in part
        ? String((part as { text: unknown }).text)
        : "",
    )
    .filter(Boolean);
  if (!texts.length) throw new Error("识别结果为空");
  return texts.join("\n");
}

async function geminiErrorMessage(response: Response): Promise<string> {
  let detail = "";
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "error" in body) {
      const error = (body as { error?: { message?: string } }).error;
      detail = error?.message ?? "";
    }
  } catch {
    detail = "";
  }
  if (response.status === 400 || response.status === 403) {
    return `Key 无效或模型不可用。${detail}`.trim();
  }
  if (response.status === 429) {
    return "今日识别次数可能已用完，请稍后或改用手填。";
  }
  return `识别失败（${response.status}）。${detail}`.trim();
}
