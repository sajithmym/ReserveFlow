import { config } from "dotenv";
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { testDatabaseUrl } from "./scripts/test-database.mjs";
// Keep optional test credentials separate from the five main database fields.
// Explicit process environment values retain precedence over either file.
config({ path: [".env.test.local", ".env"], quiet: true });
testDatabaseUrl();
process.env.DB_TARGET = "test";
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/server-only.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["tests/integration/setup.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
