import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

const secondDb = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL }),
});
const secondServer = betterAuth({
  ...auth.options,
  database: prismaAdapter(secondDb, { provider: "postgresql", transaction: true }),
});
const key = "127.0.0.1|/sign-in/email";
const credentialRaceId = randomUUID();
afterAll(async () => {
  await db.rateLimit.deleteMany({ where: { key } });
  await db.user.deleteMany({ where: { id: credentialRaceId } });
  await secondDb.$disconnect();
  await db.$disconnect();
});
describe("persistent concurrent authentication throttling", () => {
  it("shares atomic limits across app instances and ignores spoofed forwarded IPs", async () => {
    await db.rateLimit.deleteMany({ where: { key } });
    const email = `${randomUUID()}@throttling.test.local`;
    const responses = await Promise.all(
      Array.from({ length: 8 }, (_, index) => {
        const server = index % 2 === 0 ? auth : secondServer;
        return server.handler(
          new Request(`${process.env.BETTER_AUTH_URL}/api/auth/sign-in/email`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              origin: process.env.BETTER_AUTH_URL!,
              "x-forwarded-for": `192.0.2.${index + 1}`,
            },
            body: JSON.stringify({ email, password: "Test-only-invalid-password" }),
          }),
        );
      }),
    );
    expect(responses.filter((response) => response.status === 401)).toHaveLength(5);
    expect(responses.filter((response) => response.status === 429)).toHaveLength(3);
    expect((await db.rateLimit.findUniqueOrThrow({ where: { key } })).count).toBe(5);
    // A new auth instance cannot reset the persisted counter.
    const restarted = betterAuth({
      ...auth.options,
      database: prismaAdapter(secondDb, { provider: "postgresql", transaction: true }),
    });
    const denied = await restarted.handler(
      new Request(`${process.env.BETTER_AUTH_URL}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: process.env.BETTER_AUTH_URL! },
        body: JSON.stringify({ email, password: "Test-only-invalid-password" }),
      }),
    );
    expect(denied.status).toBe(429);
  });
  it("rejects an old-password login paused across a credential reset", async () => {
    await db.rateLimit.deleteMany({ where: { key } });
    const email = `${credentialRaceId}@session-race.test.local`;
    const password = `Before-reset-${randomUUID()}`;
    await db.user.create({ data: { id: credentialRaceId, email, name: "Session race fixture" } });
    await db.account.create({
      data: {
        userId: credentialRaceId,
        accountId: credentialRaceId,
        providerId: "credential",
        password: await hashPassword(password),
      },
    });
    let verified!: () => void, resume!: () => void;
    const verificationFinished = new Promise<void>((resolve) => {
      verified = resolve;
    });
    const resumed = new Promise<void>((resolve) => {
      resume = resolve;
    });
    const slowAuth = betterAuth({
      ...auth.options,
      emailAndPassword: {
        ...auth.options.emailAndPassword,
        enabled: true,
        password: {
          hash: hashPassword,
          verify: async (input) => {
            const valid = await verifyPassword(input);
            verified();
            await resumed;
            return valid;
          },
        },
      },
    });
    const login = slowAuth.handler(
      new Request(`${process.env.BETTER_AUTH_URL}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: process.env.BETTER_AUTH_URL! },
        body: JSON.stringify({ email, password }),
      }),
    );
    try {
      await verificationFinished;
      await db.user.update({
        where: { id: credentialRaceId },
        data: { sessionsInvalidBefore: new Date() },
      });
      await db.account.updateMany({
        where: { userId: credentialRaceId },
        data: { password: await hashPassword(`After-reset-${randomUUID()}`) },
      });
    } finally {
      resume();
    }
    expect((await login).status).toBe(401);
    expect(await db.session.count({ where: { userId: credentialRaceId } })).toBe(0);
  });
});
