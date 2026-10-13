import { describe, expect, it } from "vitest";
import { databaseSettings, databaseUrl, isLocalPostgresDevelopment } from "@/lib/db/config.mjs";
import { testDatabaseUrl } from "../../scripts/test-database.mjs";

const environment = {
  DB_HOST: "localhost",
  DB_PORT: "5432",
  DB_USERNAME: "postgres",
  DB_PASSWORD: "test-only",
  DB_DATABASE: "reserveflow",
};

describe("separate database environment fields", () => {
  it("encodes credentials and database names without changing their values", () => {
    const settings = {
      ...environment,
      DB_USERNAME: "name@/:?#%",
      DB_PASSWORD: "p@ss:/?#%$ with space",
      DB_DATABASE: "db@?#% name",
    };
    const url = new URL(databaseUrl(settings));
    expect(decodeURIComponent(url.username)).toBe(settings.DB_USERNAME);
    expect(decodeURIComponent(url.password)).toBe(settings.DB_PASSWORD);
    expect(decodeURIComponent(url.pathname.slice(1))).toBe(settings.DB_DATABASE);
    expect(url.search).toBe("");
    expect(url.hash).toBe("");
  });
  it("rejects missing fields, invalid ports, placeholders, and injected host syntax", () => {
    for (const DB_PORT of ["0", "65536", "5432x", "-1", "1.5"])
      expect(() => databaseUrl({ ...environment, DB_PORT })).toThrow("PORT");
    for (const DB_HOST of [
      "localhost/path",
      "user@localhost",
      "localhost:5432",
      "localhost?ssl=false",
    ])
      expect(() => databaseUrl({ ...environment, DB_HOST })).toThrow("HOST");
    expect(() => databaseUrl({ ...environment, DB_PASSWORD: undefined })).toThrow("DB_PASSWORD");
    expect(() => databaseUrl({ ...environment, DB_PASSWORD: "CHANGE_ME" })).toThrow("DB_PASSWORD");
    for (const DB_DATABASE of [".", "..", "bad\u0000name"])
      expect(() => databaseUrl({ ...environment, DB_DATABASE })).toThrow("DB_DATABASE");
    expect(() => databaseUrl({ ...environment, DB_HOST: "remote.example" })).toThrow("TLS");
  });
  it("supports IPv6 and optional migration credentials without mixing purposes", () => {
    const settings = {
      ...environment,
      DB_HOST: "[::1]",
      MIGRATION_DB_USERNAME: "owner",
      MIGRATION_DB_PASSWORD: "owner-test-only",
    };
    expect(new URL(databaseUrl(settings)).hostname).toBe("[::1]");
    expect(new URL(databaseUrl(settings)).username).toBe("postgres");
    expect(new URL(databaseUrl(settings, "migration")).username).toBe("owner");
    expect(databaseSettings(settings, "migration").PASSWORD).toBe("owner-test-only");
    expect(() => databaseUrl({ ...settings, DB_TARGET: "test" }, "migration")).toThrow(
      "Leave it unset",
    );
  });
  it("requires explicit test credentials, a local _test database, and a distinct target", () => {
    expect(() => testDatabaseUrl(environment)).toThrow("TEST_DB_USERNAME");
    const settings = {
      ...environment,
      TEST_DB_USERNAME: "test_owner",
      TEST_DB_PASSWORD: "test-only",
      TEST_DB_DATABASE: "reserveflow_test",
    };
    expect(testDatabaseUrl(settings)).toContain("reserveflow_test");
    expect(() => testDatabaseUrl({ ...settings, TEST_DB_USERNAME: "postgres" })).toThrow(
      "dedicated",
    );
    expect(() =>
      testDatabaseUrl({
        ...settings,
        TEST_DB_HOST: "remote.example",
        TEST_DB_SSL_MODE: "verify-full",
      }),
    ).toThrow("local");
    expect(() =>
      testDatabaseUrl({ ...settings, DB_DATABASE: "reserveflow_test", TEST_DB_HOST: "127.0.0.1" }),
    ).toThrow("differ");
    expect(() => testDatabaseUrl({ ...settings, TEST_DB_DATABASE: "reserveflow" })).toThrow(
      "_test",
    );
  });
  it("limits the postgres permission exception to local development and a local app origin", () => {
    const settings = {
      ...environment,
      NODE_ENV: "development",
      BETTER_AUTH_URL: "http://localhost:3000",
    };
    expect(isLocalPostgresDevelopment(settings)).toBe(true);
    expect(isLocalPostgresDevelopment({ ...settings, NODE_ENV: "production" })).toBe(false);
    expect(isLocalPostgresDevelopment({ ...settings, NODE_ENV: "test" })).toBe(false);
    expect(isLocalPostgresDevelopment({ ...settings, DB_TARGET: "test" })).toBe(false);
    expect(isLocalPostgresDevelopment({ ...settings, DB_USERNAME: "other_owner" })).toBe(false);
    expect(
      isLocalPostgresDevelopment({
        ...settings,
        DB_HOST: "remote.example",
        DB_SSL_MODE: "verify-full",
      }),
    ).toBe(false);
    expect(
      isLocalPostgresDevelopment({ ...settings, BETTER_AUTH_URL: "https://public.example" }),
    ).toBe(false);
  });
});
