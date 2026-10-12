import "dotenv/config";
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { isolatedTestDatabase } from "./scripts/test-database.mjs";
const url = isolatedTestDatabase(process.env.TEST_DATABASE_URL, process.env.DATABASE_URL);
process.env.DATABASE_URL = url;
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/server-only.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
