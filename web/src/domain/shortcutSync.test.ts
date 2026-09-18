import { describe, expect, it } from "vitest";
import {
  localDateISO,
  parseSyncParams,
  parseWorkouts,
  runShortcutHref,
  shiftLocalDateISO,
} from "./shortcutSync";

describe("localDateISO", () => {
  it("uses the local calendar date, not UTC", () => {
    expect(localDateISO(new Date(2026, 8, 16, 23, 30))).toBe("2026-09-16");
  });
});

describe("shiftLocalDateISO", () => {
  it("steps backward across month boundaries", () => {
    expect(shiftLocalDateISO("2026-09-01", -1)).toBe("2026-08-31");
  });
});

describe("parseSyncParams", () => {
  const today = "2026-09-16";
  const now = new Date("2026-09-16T10:00:00.000Z");

  it("accepts today's active energy and empty workouts", () => {
    const params = new URLSearchParams("activeKcal=420&date=2026-09-16");
    const result = parseSyncParams(params, { today, now });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot.activeKcal).toBe(420);
    expect(result.snapshot.date).toBe(today);
    expect(result.snapshot.workouts).toEqual([]);
    expect(result.snapshot.source).toBe("shortcut");
  });

  it("parses workout json", () => {
    const workouts = JSON.stringify([
      { type: "running", minutes: 32, kcal: 280 },
    ]);
    const params = new URLSearchParams({
      activeKcal: "500",
      date: today,
      workouts,
    });
    const result = parseSyncParams(params, { today, now });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot.workouts).toEqual([
      { type: "running", minutes: 32, kcal: 280 },
    ]);
  });

  it("uses today when the date query was stripped", () => {
    const params = new URLSearchParams("activeKcal=420");
    const result = parseSyncParams(params, { today, now });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot.date).toBe(today);
  });

  it("accepts a Chinese formatted date", () => {
    const params = new URLSearchParams("activeKcal=420&date=2026年9月16日");
    const result = parseSyncParams(params, { today, now });
    expect(result.ok).toBe(true);
  });

  it("rejects a link from another day", () => {
    const params = new URLSearchParams("activeKcal=420&date=2026-09-15");
    expect(parseSyncParams(params, { today })).toEqual({
      ok: false,
      error: "wrong_date",
    });
  });

  it("rejects missing kcal", () => {
    const params = new URLSearchParams("date=2026-09-16");
    expect(parseSyncParams(params, { today })).toEqual({
      ok: false,
      error: "missing_kcal",
    });
  });

  it("rejects out-of-range kcal", () => {
    const params = new URLSearchParams("activeKcal=-3&date=2026-09-16");
    expect(parseSyncParams(params, { today })).toEqual({
      ok: false,
      error: "invalid_kcal",
    });
  });
});

describe("parseWorkouts", () => {
  it("treats missing as empty", () => {
    expect(parseWorkouts(null)).toEqual({ ok: true, workouts: [] });
  });

  it("rejects non-array json", () => {
    expect(parseWorkouts("{}").ok).toBe(false);
  });
});

describe("runShortcutHref", () => {
  it("passes the site origin as shortcut input", () => {
    const href = runShortcutHref("http://192.168.31.153:5173/");
    expect(href.startsWith("shortcuts://x-callback-url/run-shortcut?")).toBe(
      true,
    );
    expect(href).toContain(encodeURIComponent("热量控制-同步今日消耗"));
    expect(href).toContain(encodeURIComponent("http://192.168.31.153:5173/"));
  });

  it("returns to the site when the shortcut errors or is cancelled", () => {
    const href = runShortcutHref("http://192.168.31.153:5173/");
    expect(href).toContain(
      encodeURIComponent("http://192.168.31.153:5173/#/sync/failed"),
    );
  });
});
