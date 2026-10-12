import "dotenv/config";
const target = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000");
if (
  target.protocol !== "http:" ||
  !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) ||
  target.username ||
  target.password ||
  target.pathname !== "/" ||
  target.search ||
  target.hash
)
  throw new Error("Browser tests require a local HTTP demonstration origin.");
export const TEST_ORIGIN = target.origin;
export const TEST_PORT = target.port || "80";
