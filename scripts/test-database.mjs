import { databaseUrl } from "../src/lib/db/config.mjs";

/** @param {Record<string, string | undefined>} environment */
export function testDatabaseUrl(environment = process.env) {
  return isolatedTestDatabase(databaseUrl(environment, "test"), databaseUrl(environment));
}

export function isolatedTestDatabase(testValue, runtimeValue) {
  let test, runtime;
  try {
    test = new URL(testValue ?? "");
    runtime = new URL(runtimeValue ?? "");
  } catch {
    throw new Error("Explicit valid application and isolated test database URLs are required.");
  }
  const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
  if (
    !/^postgres(?:ql)?:$/.test(test.protocol) ||
    !localHosts.has(test.hostname) ||
    !/^\/[A-Za-z0-9_]+_test$/.test(test.pathname) ||
    decodeURIComponent(test.username) === "postgres"
  )
    throw new Error(
      "Integration tests require a local PostgreSQL _test database with a dedicated test identity.",
    );
  const sameHost =
    test.hostname === runtime.hostname ||
    (localHosts.has(test.hostname) && localHosts.has(runtime.hostname));
  if (
    sameHost &&
    (test.port || "5432") === (runtime.port || "5432") &&
    test.pathname === runtime.pathname
  )
    throw new Error("The test database must differ from the application database.");
  return testValue;
}
