import { describe, expect, it } from "vitest";
import { parseRoute } from "./router";

describe("parseRoute", () => {
  it("reads shortcut callback from a path without ampersands", () => {
    const route = parseRoute("#/sync/2026-09-18/387");
    expect(route.name).toBe("sync");
    expect(route.params.get("date")).toBe("2026-09-18");
    expect(route.params.get("activeKcal")).toBe("387");
  });

  it("keeps hash kcal when Shortcuts peels date into the query string", () => {
    const route = parseRoute("#/sync?activeKcal=387", "?date=2026-09-18");
    expect(route.params.get("activeKcal")).toBe("387");
    expect(route.params.get("date")).toBe("2026-09-18");
  });

  it("treats a bare #/sync as the install page", () => {
    const route = parseRoute("#/sync");
    expect(route.name).toBe("sync");
    expect(route.params.get("activeKcal")).toBeNull();
  });

  it("marks a failed health callback", () => {
    const route = parseRoute("#/sync/failed");
    expect(route.name).toBe("sync");
    expect(route.params.get("health")).toBe("failed");
  });
});
