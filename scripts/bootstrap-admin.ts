import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { z } from "zod";
import { LIMITS } from "../src/config/settings";
import { SECURITY } from "../src/config/security";

const config = z.object({
  email: z
    .string()
    .trim()
    .max(254)
    .pipe(z.email())
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(LIMITS.passwordMin)
    .max(LIMITS.passwordMax)
    .refine(
      (password) => !password.startsWith("REPLACE_WITH"),
      "Replace the bootstrap password placeholder.",
    ),
});
const credentials = config.parse({
  email: process.env.ADMIN_BOOTSTRAP_EMAIL,
  password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
});
const connectionString = process.env.MIGRATION_DATABASE_URL;
if (!connectionString)
  throw new Error("MIGRATION_DATABASE_URL is required to bootstrap an administrator.");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
try {
  const existing = await db.user.findUnique({
    where: { email: credentials.email },
    select: { id: true },
  });
  if (existing)
    throw new Error(
      "The bootstrap email already exists. Use the Members page to manage that account.",
    );
  const password = await hashPassword(credentials.password);
  const user = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 AS "locked" FROM pg_advisory_xact_lock(${SECURITY.managementLock})`;
    if (await tx.user.count({ where: { role: "ADMIN", isActive: true } }))
      throw new Error(
        "An active administrator already exists. Create additional accounts through Members.",
      );
    const created = await tx.user.create({
      data: {
        email: credentials.email,
        name: "Local administrator",
        role: "ADMIN",
        emailVerified: true,
      },
    });
    await tx.account.create({
      data: {
        userId: created.id,
        accountId: created.id,
        providerId: "credential",
        password,
      },
    });
    await tx.auditEvent.create({
      data: {
        actorId: created.id,
        action: "ADMIN_BOOTSTRAP",
        entity: "USER",
        entityId: created.id,
        after: {
          id: created.id,
          email: created.email,
          role: created.role,
          isActive: created.isActive,
        },
      },
    });
    return created;
  });
  console.log(
    `Created private administrator account for ${user.email}. Remove ADMIN_BOOTSTRAP_* from .env now.`,
  );
} finally {
  await db.$disconnect();
}
