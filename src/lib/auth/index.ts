import "server-only";
import { APP_NAME, LIMITS, ROLES } from "@/config/settings";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "./password";

if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32)
  throw new Error("BETTER_AUTH_SECRET must contain at least 32 high entropy characters.");
if (!process.env.BETTER_AUTH_URL)
  throw new Error("Configure the exact application origin in BETTER_AUTH_URL.");

export const auth = betterAuth({
  appName: APP_NAME,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
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
    useSecureCookies: process.env.BETTER_AUTH_URL?.startsWith("https://"),
  },
  trustedOrigins: process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : [],
  rateLimit: {
    enabled: true,
    storage: "memory",
    window: 60,
    max: 30,
    customRules: { "/sign-in/email": { window: 60, max: 5 } },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { isActive: true },
          });
          if (!user?.isActive)
            throw new APIError("UNAUTHORIZED", { message: "Invalid email or password." });
          return { data: session };
        },
      },
    },
  },
});
