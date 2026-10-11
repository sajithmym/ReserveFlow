import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalDb = globalThis as unknown as { reserveflowDb?: PrismaClient };
const connectionString = process.env.DATABASE_URL;
if (!connectionString || !/^postgres(?:ql)?:\/\//.test(connectionString))
  throw new Error("Configure a PostgreSQL DATABASE_URL in your private .env file.");
export const db =
  globalDb.reserveflowDb ?? new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
if (process.env.NODE_ENV !== "production") globalDb.reserveflowDb = db;
