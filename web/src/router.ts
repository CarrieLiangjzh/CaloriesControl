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
  const name = NAMES.has(segment as RouteName)
    ? (segment as RouteName)
    : "today";
  if (name === "sync") {
    applySyncPathParams(parts, url.searchParams);
  }
  return { name, params: url.searchParams };
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
  if (first && /^\d{4}-\d{2}-\d{2}$/.test(first)) {
    if (!params.get("date")) params.set("date", first);
    if (second && !params.get("activeKcal")) params.set("activeKcal", second);
    return;
  }
  if (first && !params.get("activeKcal") && /^\d+(\.\d+)?$/.test(first)) {
    params.set("activeKcal", first);
  }
}

export function href(name: RouteName): string {
  return `#/${name}`;
}
