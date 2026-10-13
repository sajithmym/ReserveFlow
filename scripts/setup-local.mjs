import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { config } from "dotenv";

if (!existsSync(".env")) {
  const secret = () => randomBytes(32).toString("hex");
  const ownerPassword = secret();
  const appPassword = secret();
  const testPassword = secret();
  writeFileSync(
    ".env",
    [
      "# Database Configuration (PostgreSQL)",
      "DB_HOST=127.0.0.1",
      "DB_PORT=54329",
      "DB_USERNAME=reserveflow_app",
      `DB_PASSWORD=${appPassword}`,
      "DB_DATABASE=reserveflow",
      "MIGRATION_DB_USERNAME=reserveflow_owner",
      `MIGRATION_DB_PASSWORD=${ownerPassword}`,
      "TEST_DB_USERNAME=reserveflow_test_owner",
      `TEST_DB_PASSWORD=${testPassword}`,
      "TEST_DB_DATABASE=reserveflow_test",
      "BETTER_AUTH_URL=http://localhost:3000",
      `BETTER_AUTH_SECRET=${secret()}`,
      `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=${randomBytes(32).toString("base64")}`,
      "LOCAL_POSTGRES=true",
      "",
    ].join("\n"),
    { mode: 0o600, flag: "wx" },
  );
  console.log("Created ignored .env with private database credentials and authentication secret.");
}
config({ quiet: true });
function run(script, args = [], env = process.env) {
  const result = spawnSync(process.execPath, [script, ...args], {
    stdio: "inherit",
    env,
    windowsHide: true,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (process.env.LOCAL_POSTGRES === "true") run("scripts/local-db.mjs", ["start"]);
run("node_modules/prisma/build/index.js", ["generate"]);
run("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
run("scripts/grant-runtime.mjs");
run("node_modules/prisma/build/index.js", ["db", "seed"]);
if (process.env.LOCAL_POSTGRES === "true" && process.env.TEST_DB_DATABASE) {
  run("node_modules/prisma/build/index.js", ["migrate", "deploy"], {
    ...process.env,
    DB_TARGET: "test",
  });
}
console.log(
  process.env.LOCAL_POSTGRES === "true"
    ? "ReserveFlow is ready. Run npm run dev. Demo logins are in README.md and SETUP_AND_RUN.txt."
    : "ReserveFlow is ready. Bootstrap a private administrator with npm run db:bootstrap-admin if needed, then run npm run dev.",
);
