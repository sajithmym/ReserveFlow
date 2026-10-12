import "server-only";
import { APP_NAME, LIMITS, ROLES } from "@/config/settings";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "./password";
import { authConfiguration } from "@/lib/security/configuration";
import { SECURITY } from "@/config/security";

const configuration = authConfiguration(process.env);

export const auth = betterAuth({
  appName: APP_NAME,
  baseURL: configuration.origin,
  secret: configuration.secret,
  database: prismaAdapter(db, { provider: "postgresql", transaction: true }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: LIMITS.passwordMin,
    maxPasswordLength: LIMITS.passwordMax,
    password: { hash: hashPassword, verify: verifyPassword },
  },
  user: {
    additionalFields: {
      role: { type: [...ROLES], defaultValue: "MEMBER", input: false },
      isActive: { type: "boolean", defaultValue: true, input: false },
    },
  },
  session: { expiresIn: 60 * 60 * 24, updateAge: 60 * 60, cookieCache: { enabled: false } },
  advanced: {
    database: { generateId: "uuid" },
    useSecureCookies: configuration.secureCookies,
    defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
    // Empty by default: client-supplied forwarded headers cannot reset throttling.
    ipAddress: { ipAddressHeaders: configuration.ipHeaders },
  },
  trustedOrigins: [configuration.origin],
  hooks: {
    before: createAuthMiddleware(async (context) => {
      if (context.path === "/sign-in/email")
        Object.assign(context.context, { signInStartedAt: Date.now() });
    }),
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: SECURITY.rateWindowSeconds,
    max: SECURITY.authRequestsPerWindow,
    customRules: {
      "/sign-in/email": {
        window: SECURITY.rateWindowSeconds,
        max: SECURITY.signInRequestsPerWindow,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session, context) => {
          const started =
            context && "signInStartedAt" in context.context
              ? context.context.signInStartedAt
              : undefined;
          const createdAt = typeof started === "number" ? new Date(started) : session.createdAt;
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { isActive: true, sessionsInvalidBefore: true },
          });
          if (
            !user?.isActive ||
            (user.sessionsInvalidBefore && createdAt <= user.sessionsInvalidBefore)
          )
            throw new APIError("UNAUTHORIZED", { message: "Invalid email or password." });
          return { data: { ...session, createdAt } };
        },
      },
    },
  },
});
