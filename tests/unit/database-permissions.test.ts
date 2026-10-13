import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const query = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ db: { $queryRaw: query } }));
import { assertRuntimePermissions } from "@/lib/db/permissions";

const restricted = {
  elevated: false,
  ownsTables: false,
  canChangeSchema: false,
  canDeleteHistory: false,
  canChangeAudit: false,
  canWriteAudit: true,
  canThrottle: true,
};
beforeEach(() => {
  query.mockReset();
  for (const [key, value] of Object.entries({
    NODE_ENV: "development",
    DB_HOST: "localhost",
    DB_PORT: "5432",
    DB_USERNAME: "postgres",
    DB_PASSWORD: "test-only",
    DB_DATABASE: "reserveflow",
    BETTER_AUTH_URL: "http://localhost:3000",
    DB_TARGET: undefined,
  }))
    vi.stubEnv(key, value);
});
afterEach(() => vi.unstubAllEnvs());
describe("database startup permissions", () => {
  it("accepts explicitly configured local postgres development after querying permissions", async () => {
    query.mockResolvedValue([
      { ...restricted, elevated: true, ownsTables: true, canChangeAudit: true },
    ]);
    await expect(assertRuntimePermissions()).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledOnce();
  });
  it("rejects elevated credentials in production and for other development identities", async () => {
    query.mockResolvedValue([{ ...restricted, elevated: true }]);
    vi.stubEnv("NODE_ENV", "production");
    await expect(assertRuntimePermissions()).rejects.toThrow("excessive permissions");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DB_USERNAME", "other_owner");
    await expect(assertRuntimePermissions()).rejects.toThrow("excessive permissions");
  });
  it("retains missing-grant checks for restricted identities", async () => {
    vi.stubEnv("DB_USERNAME", "app");
    query.mockResolvedValue([{ ...restricted, canWriteAudit: false }]);
    await expect(assertRuntimePermissions()).rejects.toThrow(
      "missing audit/rate-limit permissions",
    );
    query.mockResolvedValue([restricted]);
    await expect(assertRuntimePermissions()).resolves.toBeUndefined();
  });
});
