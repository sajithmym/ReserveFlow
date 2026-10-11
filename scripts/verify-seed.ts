import "dotenv/config";
import { spawnSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

if (process.env.LOCAL_POSTGRES !== "true")
  throw new Error("Seed verification is only enabled for the isolated local demo.");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.MIGRATION_DATABASE_URL }),
});
async function snapshot() {
  return {
    users: await db.user.count(),
    resources: await db.resource.count(),
    reservations: await db.reservation.count(),
    accounts: await db.account.findMany({
      select: { id: true, password: true },
      orderBy: { id: "asc" },
    }),
  };
}
try {
  const before = await snapshot();
  const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "db", "seed"], {
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error("Seed rerun failed.");
  const after = await snapshot();
  if (JSON.stringify(before) !== JSON.stringify(after))
    throw new Error("Seed rerun changed existing records or credential hashes.");
  console.log("PASS: Seed rerun preserved row counts and existing credential hashes.");
} finally {
  await db.$disconnect();
}
