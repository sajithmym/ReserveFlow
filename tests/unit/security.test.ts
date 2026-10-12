import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { authConfiguration, databaseConnection } from "@/lib/security/configuration";
import { boundedBody } from "@/lib/security/request-body";
import { SECURITY } from "@/config/security";
import { proxy } from "@/proxy";
import { isolatedTestDatabase } from "../../scripts/test-database.mjs";
import { createHash } from "node:crypto";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
const secret = "test-only-" + "a".repeat(64);
describe("authentication deployment boundaries", () => {
  it("refuses remote tests, superuser tests, and application/test aliases", () => {
    const runtime = "postgresql://app:private@localhost:5432/reserveflow";
    expect(
      isolatedTestDatabase("postgresql://test:private@localhost:5432/reserveflow_test", runtime),
    ).toContain("_test");
    expect(() =>
      isolatedTestDatabase("postgresql://test:private@remote.example/db_test", runtime),
    ).toThrow();
    expect(() =>
      isolatedTestDatabase("postgresql://postgres:private@localhost:5432/db_test", runtime),
    ).toThrow();
    expect(() =>
      isolatedTestDatabase(
        "postgresql://test:private@127.0.0.1:5432/reserveflow_test",
        "postgresql://app:private@localhost:5432/reserveflow_test",
      ),
    ).toThrow("differ");
  });
  it("accepts local previews and HTTPS, rejects remote HTTP and malformed origins", () => {
    expect(
      authConfiguration({ BETTER_AUTH_URL: "http://localhost:3000", BETTER_AUTH_SECRET: secret }),
    ).toMatchObject({ secureCookies: false, ipHeaders: [] });
    expect(
      authConfiguration({
        BETTER_AUTH_URL: "https://reserveflow.example",
        BETTER_AUTH_SECRET: secret,
      }),
    ).toMatchObject({ secureCookies: true });
    for (const origin of [
      "http://reserveflow.example",
      "ftp://localhost",
      "https://example.org/path",
      "https://user:password@example.org",
      "https://example.org?x=1",
    ])
      expect(() =>
        authConfiguration({ BETTER_AUTH_URL: origin, BETTER_AUTH_SECRET: secret }),
      ).toThrow();
    expect(() =>
      authConfiguration({
        BETTER_AUTH_URL: "http://localhost:3000",
        BETTER_AUTH_SECRET: "REPLACE_WITH_AT_LEAST_32_RANDOM_BYTES",
      }),
    ).toThrow();
  });
  it("rejects the superuser and requires verified TLS for remote databases", () => {
    expect(() =>
      databaseConnection("postgresql://postgres:test@localhost:5432/reserveflow"),
    ).toThrow("restricted runtime role");
    expect(() =>
      databaseConnection("postgresql://%70ostgres:test@localhost/reserveflow"),
    ).toThrow();
    expect(() =>
      databaseConnection(
        "postgresql://app:test@remote.example/reserveflow?sslmode=require&uselibpqcompat=true",
      ),
    ).toThrow();
    expect(() =>
      databaseConnection(
        "postgresql://app:test@remote.example/reserveflow?sslmode=verify-full&ssl=false",
      ),
    ).toThrow();
    expect(
      databaseConnection("postgresql://app:test@remote.example/reserveflow?sslmode=verify-full"),
    ).toContain("verify-full");
  });
  it("overwrites client-supplied CSP/nonces and generates fresh production nonces", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BETTER_AUTH_URL", "https://reserveflow.example");
    const request = new NextRequest("https://reserveflow.example/login", {
      headers: { "x-nonce": "forged", "content-security-policy": "script-src *" },
    });
    const first = proxy(request),
      second = proxy(request);
    const policy = first.headers.get("content-security-policy")!;
    expect(policy).toContain("strict-dynamic");
    expect(policy).not.toContain("unsafe-inline");
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).toContain(
      `style-src-attr 'unsafe-hashes' 'sha256-${createHash("sha256").update("display:none").digest("base64")}'`,
    );
    expect(policy).not.toContain("forged");
    expect(policy).not.toBe(second.headers.get("content-security-policy"));
    expect(first.headers.get("x-middleware-request-content-security-policy")).toBe(policy);
  });
});
describe("bounded authentication bodies", () => {
  it("reads a normal body and rejects chunked oversize without relying on Content-Length", async () => {
    const request = new Request("http://localhost/login", { method: "POST", body: "{}" });
    expect(new TextDecoder().decode(await boundedBody(request))).toBe("{}");
    const large = new Request("http://localhost/login", {
      method: "POST",
      body: "x".repeat(SECURITY.authBodyBytes + 1),
    });
    await expect(boundedBody(large)).rejects.toMatchObject({ status: 413 });
  });
  it("terminates stalled bodies", async () => {
    vi.useFakeTimers();
    const request = new Request("http://localhost/login", {
      method: "POST",
      body: new ReadableStream(),
      duplex: "half",
    } as RequestInit);
    const reading = boundedBody(request);
    const assertion = expect(reading).rejects.toMatchObject({ status: 408 });
    await vi.advanceTimersByTimeAsync(SECURITY.authBodyTimeoutMs);
    await assertion;
  });
});
