import "dotenv/config";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";

if (process.env.LOCAL_POSTGRES !== "true")
  throw new Error("Credential rotation is restricted to the isolated local demo.");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.MIGRATION_DATABASE_URL }),
});
const replacements = await Promise.all(
  ["ADMIN", "MEMBER"].map(async (role) => {
    const password = randomBytes(32).toString("hex");
    return {
      key: `SEED_${role}_PASSWORD`,
      email: process.env[`SEED_${role}_EMAIL`]!,
      password,
      hash: await hashPassword(password),
    };
  }),
);
try {
  await db.$transaction(async (tx) => {
    for (const item of replacements) {
      const user = await tx.user.findUniqueOrThrow({ where: { email: item.email } });
      await tx.account.update({
        where: { providerId_accountId: { providerId: "credential", accountId: user.id } },
        data: { password: item.hash },
      });
      await tx.session.deleteMany({ where: { userId: user.id } });
    }
  });
  let env = readFileSync(".env", "utf8");
  for (const item of replacements)
    env = env.replace(new RegExp(`^${item.key}=.*$`, "m"), `${item.key}=${item.password}`);
  writeFileSync(".env", env, { mode: 0o600 });
  console.log(
    "Rotated local demo passwords in private .env and revoked their sessions. No passwords were printed.",
  );
} finally {
  await db.$disconnect();
}
