import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { DEMO_ACCOUNTS, getDemoAccounts } from "../../scripts/demo-accounts.mjs";

beforeEach(() => {
  for (const [key, value] of Object.entries({
    DB_HOST: "127.0.0.1",
    DB_PORT: "54329",
    DB_USERNAME: "app",
    DB_PASSWORD: "test-only",
    DB_DATABASE: "reserveflow",
    DB_SSL_MODE: undefined,
    MIGRATION_DB_HOST: undefined,
    MIGRATION_DB_PORT: undefined,
    MIGRATION_DB_USERNAME: undefined,
    MIGRATION_DB_PASSWORD: undefined,
    MIGRATION_DB_DATABASE: undefined,
    MIGRATION_DB_SSL_MODE: undefined,
  }))
    vi.stubEnv(key, value);
});
afterEach(() => vi.unstubAllEnvs());
describe("public local demonstration accounts", () => {
  it("uses documented fixed logins without seed password environment variables", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("LOCAL_POSTGRES", "true");
    vi.stubEnv("DB_DATABASE", "reserveflow_test");
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
    vi.stubEnv("LOCAL_POSTGRES", "true");
    vi.stubEnv("DB_HOST", "remote.example");
    vi.stubEnv("DB_SSL_MODE", "verify-full");
    expect(() => getDemoAccounts()).toThrow("local development databases");
  });
  it("refuses production mode even when the database is local", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("LOCAL_POSTGRES", "true");
    vi.stubEnv("MIGRATION_DB_HOST", "localhost");
    expect(() => getDemoAccounts()).toThrow("local development databases");
  });
  it("refuses a remote runtime database even when the migration database is local", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("LOCAL_POSTGRES", "true");
    vi.stubEnv("MIGRATION_DB_HOST", "localhost");
    vi.stubEnv("DB_HOST", "remote.example");
    vi.stubEnv("DB_SSL_MODE", "verify-full");
    expect(() => getDemoAccounts()).toThrow("local development databases");
  });
  it("reports malformed connection configuration without exposing it", () => {
    vi.stubEnv("LOCAL_POSTGRES", "true");
    vi.stubEnv("DB_HOST", "invalid-private-connection/credential");
    expect(() => getDemoAccounts()).toThrow("Configure a local PostgreSQL connection");
  });
  it("refuses public demo credentials outside the isolated cluster", () => {
    vi.stubEnv("LOCAL_POSTGRES", "false");

    expect(() => getDemoAccounts()).toThrow("isolated LOCAL_POSTGRES=true");
  });
  it("refuses the ordinary PostgreSQL service even if the demo flag is set", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("LOCAL_POSTGRES", "true");
    vi.stubEnv("DB_HOST", "localhost");
    vi.stubEnv("DB_PORT", "5432");
    expect(() => getDemoAccounts()).toThrow("local development databases");
  });
});
