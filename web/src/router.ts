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

export function parseRoute(hash = window.location.hash): AppRoute {
  const raw = hash.replace(/^#/, "") || "/today";
  const url = new URL(
    raw.startsWith("/") ? raw : `/${raw}`,
    "https://calories.local",
  );
  const segment = url.pathname.replace(/^\//, "").split("/")[0] || "today";
  const name = NAMES.has(segment as RouteName)
    ? (segment as RouteName)
    : "today";
  return { name, params: url.searchParams };
}

export function href(name: RouteName): string {
  return `#/${name}`;
}
