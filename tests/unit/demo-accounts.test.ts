import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { DEMO_ACCOUNTS, getDemoAccounts } from "../../scripts/demo-accounts.mjs";

beforeEach(() => vi.stubEnv("DATABASE_URL", undefined));
afterEach(() => vi.unstubAllEnvs());
describe("public local demonstration accounts", () => {
  it("uses documented fixed logins without seed password environment variables", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("MIGRATION_DATABASE_URL", "postgresql://owner@127.0.0.1:54329/reserveflow_test");
    vi.stubEnv("SEED_ADMIN_PASSWORD", undefined);
    vi.stubEnv("SEED_MEMBER_PASSWORD", undefined);
    expect(getDemoAccounts()).toBe(DEMO_ACCOUNTS);
    for (const path of ["../../README.md", "../../SETUP_AND_RUN.txt"]) {
      const content = readFileSync(new URL(path, import.meta.url), "utf8");
      for (const account of Object.values(DEMO_ACCOUNTS)) {
        expect(content.includes(account.email)).toBe(true);
        expect(content.includes(account.password)).toBe(true);
        expect(account.password.length).toBeGreaterThanOrEqual(12);
      }
    }
    expect(DEMO_ACCOUNTS.ADMIN.email).not.toBe(DEMO_ACCOUNTS.MEMBER.email);
  });
  it("refuses public demo credentials for a remote database", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("MIGRATION_DATABASE_URL", "postgresql://owner@remote.example/reserveflow");
    expect(() => getDemoAccounts()).toThrow("local development databases");
  });
  it("refuses production mode even when the database is local", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MIGRATION_DATABASE_URL", "postgresql://owner@localhost/reserveflow");
    expect(() => getDemoAccounts()).toThrow("local development databases");
  });
  it("refuses a remote runtime database even when the migration database is local", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("MIGRATION_DATABASE_URL", "postgresql://owner@localhost/reserveflow");
    vi.stubEnv("DATABASE_URL", "postgresql://app@remote.example/reserveflow");
    expect(() => getDemoAccounts()).toThrow("local development databases");
  });
  it("reports malformed connection configuration without exposing it", () => {
    vi.stubEnv("MIGRATION_DATABASE_URL", "invalid-private-connection");
    expect(() => getDemoAccounts()).toThrow("Configure a local PostgreSQL connection");
  });
});
