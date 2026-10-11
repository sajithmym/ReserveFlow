import "dotenv/config";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import pg from "pg";

if (process.env.LOCAL_POSTGRES !== "true")
  throw new Error("Local cluster is disabled. Configure LOCAL_POSTGRES=true to use this helper.");
const candidates = [
  process.env.PG_BIN,
  ...[18, 17, 16].map((v) => `C:/Program Files/PostgreSQL/${v}/bin`),
  "/usr/lib/postgresql/18/bin",
  "/usr/lib/postgresql/17/bin",
  "/usr/lib/postgresql/16/bin",
];
const executable = (name) => (process.platform === "win32" ? `${name}.exe` : name);
const binaryDir = candidates.find((dir) => dir && existsSync(join(dir, executable("pg_ctl"))));
if (!binaryDir)
  throw new Error(
    "PostgreSQL binaries not found. Install PostgreSQL 16+ and set PG_BIN to its bin directory.",
  );
const clusterDir = resolve(".local/postgres");
if (!clusterDir.startsWith(resolve(".local") + (process.platform === "win32" ? "\\" : "/")))
  throw new Error("Invalid cluster location.");
mkdirSync(resolve(".local"), { recursive: true });
// On Windows PostgreSQL descendants can retain inherited pipes after pg_ctl exits.
const run = (binary, args) =>
  spawnSync(join(binaryDir, executable(binary)), args, { stdio: "ignore", windowsHide: true });
const status = () => run("pg_ctl", ["-D", clusterDir, "status"]).status === 0;
if (process.argv[2] === "stop") {
  if (status()) {
    const result = run("pg_ctl", ["-D", clusterDir, "-m", "fast", "-w", "stop"]);
    if (result.status !== 0)
      throw new Error("Could not stop the ReserveFlow cluster. Check .local/postgres.log.");
  }
  console.log("ReserveFlow local cluster stopped; data retained.");
  process.exit(0);
}
const connection = new URL(process.env.MIGRATION_DATABASE_URL ?? "");
if (
  connection.hostname !== "127.0.0.1" ||
  connection.port !== "54329" ||
  connection.username !== "reserveflow_owner"
) {
  throw new Error(
    "Local helper expects the isolated reserveflow_owner cluster on 127.0.0.1:54329. Use npm run setup to generate its configuration.",
  );
}
if (!existsSync(join(clusterDir, "PG_VERSION"))) {
  const passwordPath = resolve(".local/init-password");
  writeFileSync(passwordPath, decodeURIComponent(connection.password), { mode: 0o600 });
  try {
    const result = run("initdb", [
      "-D",
      clusterDir,
      "-U",
      "reserveflow_owner",
      "--auth=scram-sha-256",
      `--pwfile=${passwordPath}`,
      "--encoding=UTF8",
      "--locale=C",
    ]);
    if (result.status !== 0)
      throw new Error(
        "Could not initialize the isolated cluster. Check PostgreSQL binary permissions.",
      );
  } finally {
    unlinkSync(passwordPath);
  }
}
if (!status()) {
  const result = run("pg_ctl", [
    "-D",
    clusterDir,
    "-l",
    resolve(".local/postgres.log"),
    "-o",
    "-p 54329 -h 127.0.0.1",
    "-w",
    "start",
  ]);
  if (result.status !== 0)
    throw new Error(
      "Could not start the isolated cluster. Check .local/postgres.log and port 54329.",
    );
}
const url = new URL(connection);
url.pathname = "/postgres";
const client = new pg.Client({ connectionString: url.toString() });
await client.connect();
try {
  for (const name of ["reserveflow", "reserveflow_test"]) {
    const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
    if (!rowCount) await client.query(`CREATE DATABASE "${name}"`);
  }
  const { rowCount } = await client.query(
    "SELECT 1 FROM pg_roles WHERE rolname = 'reserveflow_app'",
  );
  if (!rowCount) {
    const password = process.env.LOCAL_DB_APP_PASSWORD;
    if (!password || !/^[a-zA-Z0-9_-]{20,}$/.test(password))
      throw new Error("A strong LOCAL_DB_APP_PASSWORD is required.");
    const { rows } = await client.query(
      "SELECT format('CREATE ROLE reserveflow_app LOGIN PASSWORD %L', $1::text) AS sql",
      [password],
    );
    await client.query(rows[0].sql);
  }
} finally {
  await client.end();
}
console.log("Isolated PostgreSQL ready at 127.0.0.1:54329 (development and test databases).");
