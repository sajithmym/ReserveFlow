import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { databaseConnection } from "@/lib/security/configuration";

const globalDb = globalThis as unknown as { reserveflowDb?: PrismaClient };
const connectionString = databaseConnection(process.env.DATABASE_URL);
export const db =
  globalDb.reserveflowDb ?? new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
if (process.env.NODE_ENV !== "production") globalDb.reserveflowDb = db;
