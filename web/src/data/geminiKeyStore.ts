export const GEMINI_KEY_STORAGE = "calories-control:gemini-key:v1";

export function loadGeminiKey(): string {
  return window.localStorage.getItem(GEMINI_KEY_STORAGE)?.trim() ?? "";
}

export function saveGeminiKey(key: string): void {
  const trimmed = key.trim();
  if (!trimmed) {
    window.localStorage.removeItem(GEMINI_KEY_STORAGE);
    return;
  }
  window.localStorage.setItem(GEMINI_KEY_STORAGE, trimmed);
}

export function geminiKeyHint(key = loadGeminiKey()): string {
  if (!key) return "";
  if (key.length <= 8) return "已保存";
  return `已保存 · 末四位 ${key.slice(-4)}`;
}
