import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import { databaseUrl } from "./src/lib/db/config.mjs";
import { testDatabaseUrl } from "./scripts/test-database.mjs";
config({
  path: process.env.DB_TARGET === "test" ? [".env.test.local", ".env"] : ".env",
  quiet: true,
});
// npm ci/postinstall must generate the client before a fresh checkout has .env.
// Migration commands still require a configured datasource, validated by the helper.
const configured = ["HOST", "PORT", "USERNAME", "PASSWORD", "DATABASE"].some(
  (field) => process.env[`DB_${field}`] !== undefined,
);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: configured
    ? {
        url:
          process.env.DB_TARGET === "test"
            ? testDatabaseUrl()
            : databaseUrl(process.env, "migration"),
      }
    : undefined,
});
