import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalDb = globalThis as unknown as { reserveflowDb?: PrismaClient };
const connectionString = process.env.DATABASE_URL;
if (!connectionString || !/^postgres(?:ql)?:\/\//.test(connectionString))
  throw new Error("Configure a PostgreSQL DATABASE_URL in your private .env file.");
const connection = new URL(connectionString);
if (connection.username === "postgres")
  throw new Error(
    "DATABASE_URL must use the restricted reserveflow_app role, not PostgreSQL's postgres superuser.",
  );
const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
if (
  !localHosts.has(connection.hostname) &&
  !["require", "verify-ca", "verify-full"].includes(connection.searchParams.get("sslmode") ?? "")
)
  throw new Error(
    "Remote DATABASE_URL connections must require TLS with sslmode=require or stronger.",
  );
export const db =
  globalDb.reserveflowDb ?? new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
if (process.env.NODE_ENV !== "production") globalDb.reserveflowDb = db;
