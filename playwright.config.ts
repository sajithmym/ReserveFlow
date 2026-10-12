import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { TEST_ORIGIN, TEST_PORT } from "./tests/e2e/environment";
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: TEST_ORIGIN,
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run ${process.env.PLAYWRIGHT_SERVER_MODE === "production" ? "start" : "dev"} -- --port ${TEST_PORT}`,
    url: `${TEST_ORIGIN}/login`,
    env: { BETTER_AUTH_URL: TEST_ORIGIN },
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "true" && !process.env.CI,
    timeout: 180000,
  },
});
