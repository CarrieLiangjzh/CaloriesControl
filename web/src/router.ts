import { isSyncDateToken } from "./domain/shortcutSync";

export type RouteName = "today" | "food" | "workout" | "profile" | "sync";

export type AppRoute = {
  name: RouteName;
  params: URLSearchParams;
};

const NAMES = new Set<RouteName>([
  "today",
  "food",
  "workout",
  "profile",
  "sync",
]);

export function parseRoute(
  hash = window.location.hash,
  search = "",
): AppRoute {
  const raw = hash.replace(/^#/, "") || "/today";
  const url = new URL(
    raw.startsWith("/") ? raw : `/${raw}`,
    "https://calories.local",
  );
  const extra = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  for (const [key, value] of extra) {
    if (!url.searchParams.get(key) && value) {
      url.searchParams.set(key, value);
    }
  }
  const parts = url.pathname.replace(/^\//, "").split("/").filter(Boolean);
  const segment = parts[0] || "today";
  let name = NAMES.has(segment as RouteName)
    ? (segment as RouteName)
    : "today";
  if (name === "sync") {
    applySyncPathParams(parts, url.searchParams);
  }
  applyShortcutCallbackResult(url.searchParams);
  if (
    name !== "sync" &&
    (url.searchParams.get("activeKcal") ||
      url.searchParams.get("health") === "failed")
  ) {
    name = "sync";
  }
  return { name, params: url.searchParams };
}

function applyShortcutCallbackResult(params: URLSearchParams): void {
  const raw = params.get("result") ?? params.get("x-result") ?? "";
  if (!raw.trim()) return;
  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded.replace(/\+/g, " "));
  } catch {
    decoded = raw.trim();
  }
  const marker = "#/sync/";
  const hashIndex = decoded.indexOf(marker);
  if (hashIndex >= 0) {
    applySyncPathParams(
      ["sync", ...decoded.slice(hashIndex + marker.length).split("/")],
      params,
    );
    return;
  }
  const pieces = decoded.split("/").filter(Boolean);
  const first = pieces[0] ?? "";
  const second = pieces[1] ?? "";
  if (pieces.length >= 2 && isSyncDateToken(first)) {
    if (!params.get("date")) params.set("date", first);
    if (!params.get("activeKcal")) params.set("activeKcal", second);
    return;
  }
  if (!params.get("activeKcal") && /^\d+([.,]\d+)?$/.test(decoded)) {
    params.set("activeKcal", decoded);
  }
}

function applySyncPathParams(
  parts: string[],
  params: URLSearchParams,
): void {
  const first = parts[1];
  const second = parts[2];
  if (first === "failed") {
    params.set("health", "failed");
    return;
  }
  if (first && isSyncDateToken(first)) {
    if (!params.get("date")) params.set("date", first);
    if (second && !params.get("activeKcal")) params.set("activeKcal", second);
    return;
  }
  if (first && !params.get("activeKcal") && /^\d+([.,]\d+)?$/.test(first)) {
    params.set("activeKcal", first);
  }
}

export function href(name: RouteName): string {
  return `#/${name}`;
}
