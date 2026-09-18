export const SHORTCUT_NAME = "热量控制-同步今日消耗";

export type WorkoutSnapshot = {
  type: string;
  minutes?: number;
  kcal?: number;
  note?: string;
};

export type HealthDayCache = {
  date: string;
  activeKcal: number;
  workouts: WorkoutSnapshot[];
  source: "shortcut" | "manual";
  fetchedAt: string;
};

export type SyncParseError =
  | "missing_kcal"
  | "invalid_kcal"
  | "missing_date"
  | "wrong_date"
  | "invalid_workouts";

export type SyncParseResult =
  | { ok: true; snapshot: HealthDayCache }
  | { ok: false; error: SyncParseError };

export function localDateISO(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Shortcuts often insert 2026年9月18日, 18-09-2026, or 2026/9/18 instead of ISO. */
export function normalizeSyncDate(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const iso = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  }
  const zh = trimmed.match(/^(\d{4})年(\d{1,2})月(\d{1,2})/);
  if (zh) {
    return `${zh[1]}-${zh[2].padStart(2, "0")}-${zh[3].padStart(2, "0")}`;
  }
  const yearLast = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (yearLast) {
    const first = Number(yearLast[1]);
    const second = Number(yearLast[2]);
    const year = yearLast[3];
    const dayFirst = first > 12 && second <= 12;
    const monthFirst = second > 12 && first <= 12;
    const day = dayFirst || !monthFirst ? first : second;
    const month = dayFirst || !monthFirst ? second : first;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  return trimmed;
}

export function isSyncDateToken(raw: string): boolean {
  const trimmed = raw.trim();
  return (
    /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(trimmed) ||
    /^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(trimmed)
  );
}

/** Locale sums often look like 153,381 (decimal comma) or 153.381. */
export function parseActiveKcal(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, "").replace(/kcal$/i, "");
  if (!trimmed) return null;
  const candidates = [
    Number(trimmed.replace(",", ".")),
    Number(trimmed.replace(/,/g, "")),
  ];
  for (const value of candidates) {
    if (Number.isFinite(value) && value >= 0 && value <= 20000) {
      return value;
    }
  }
  return null;
}

export function shiftLocalDateISO(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return localDateISO(new Date(year, month - 1, day + days));
}

export function parseSyncParams(
  params: URLSearchParams,
  options?: { today?: string; now?: Date; source?: HealthDayCache["source"] },
): SyncParseResult {
  const today = options?.today ?? localDateISO(options?.now);
  const fetchedAt = (options?.now ?? new Date()).toISOString();
  const source = options?.source ?? "shortcut";

  const date = normalizeSyncDate(params.get("date") ?? "") || today;
  if (date !== today) return { ok: false, error: "wrong_date" };

  const rawKcal = params.get("activeKcal");
  if (rawKcal === null || rawKcal.trim() === "") {
    return { ok: false, error: "missing_kcal" };
  }
  const activeKcal = parseActiveKcal(rawKcal);
  if (activeKcal === null) {
    return { ok: false, error: "invalid_kcal" };
  }

  const workoutsResult = parseWorkouts(params.get("workouts"));
  if (!workoutsResult.ok) return workoutsResult;

  return {
    ok: true,
    snapshot: {
      date,
      activeKcal: Math.round(activeKcal),
      workouts: workoutsResult.workouts,
      source,
      fetchedAt,
    },
  };
}

export function parseWorkouts(
  raw: string | null,
): { ok: true; workouts: WorkoutSnapshot[] } | { ok: false; error: "invalid_workouts" } {
  if (raw === null || raw.trim() === "") {
    return { ok: true, workouts: [] };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { ok: false, error: "invalid_workouts" };
    const workouts: WorkoutSnapshot[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") {
        return { ok: false, error: "invalid_workouts" };
      }
      const record = item as Record<string, unknown>;
      const type = typeof record.type === "string" ? record.type.trim() : "";
      if (!type) return { ok: false, error: "invalid_workouts" };
      const workout: WorkoutSnapshot = { type };
      if (record.minutes !== undefined) {
        const minutes = Number(record.minutes);
        if (!Number.isFinite(minutes) || minutes < 0) {
          return { ok: false, error: "invalid_workouts" };
        }
        workout.minutes = minutes;
      }
      if (record.kcal !== undefined) {
        const kcal = Number(record.kcal);
        if (!Number.isFinite(kcal) || kcal < 0) {
          return { ok: false, error: "invalid_workouts" };
        }
        workout.kcal = kcal;
      }
      if (typeof record.note === "string" && record.note.trim()) {
        workout.note = record.note.trim();
      }
      workouts.push(workout);
    }
    return { ok: true, workouts };
  } catch {
    return { ok: false, error: "invalid_workouts" };
  }
}

export function syncErrorMessage(error: SyncParseError): string {
  switch (error) {
    case "missing_kcal":
      return "回跳里没有消耗数字。请检查快捷指令是否读到活动能量，或改用手填。";
    case "invalid_kcal":
      return "消耗数字无效。请用手填，对照健身 App 活动环的千卡。";
    case "missing_date":
      return "回跳缺少日期。把网址改成 网站#/sync/今天日期/热量数字，不要用问号和 &。";
    case "wrong_date":
      return "这是其他日期的链接，没有写入。请重新同步，或手填今天的消耗。";
    case "invalid_workouts":
      return "锻炼列表解析失败。消耗仍可手填；锻炼可先空着。";
  }
}

export function callbackBaseUrl(
  locationLike: Pick<Location, "origin" | "pathname"> = window.location,
): string {
  return `${locationLike.origin}${locationLike.pathname.replace(/index\.html$/i, "")}`;
}

export function runShortcutHref(baseUrl = callbackBaseUrl()): string {
  const name = encodeURIComponent(SHORTCUT_NAME);
  const input = encodeURIComponent(baseUrl);
  return `shortcuts://run-shortcut?name=${name}&input=${input}`;
}
