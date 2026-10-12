import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { getDemoAccounts } from "./demo-accounts.mjs";

if (process.env.LOCAL_POSTGRES !== "true")
  throw new Error("Demo password reset is restricted to the isolated local demo.");
const accounts = getDemoAccounts();
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.MIGRATION_DATABASE_URL }),
});
const replacements = await Promise.all(
  (["ADMIN", "MEMBER"] as const).map(async (role) => {
    const { email, password } = accounts[role];
    return {
      email,
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
  console.log(
    "Restored documented local demo passwords and revoked their sessions. Existing accounts and reservations were retained.",
  );
} finally {
  await db.$disconnect();
}
