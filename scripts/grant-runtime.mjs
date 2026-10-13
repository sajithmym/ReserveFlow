import "dotenv/config";
import pg from "pg";
import {
  databaseUrl,
  isLocalPostgresDevelopment,
  databaseSettings,
} from "../src/lib/db/config.mjs";

// A postgres connection on an existing local service already has all privileges.
// Do not revoke its grants or alter the database's permission model.
const settings = databaseSettings();
if (
  isLocalPostgresDevelopment({ ...process.env, NODE_ENV: process.env.NODE_ENV ?? "development" })
) {
  console.log(
    "Local postgres development connection needs no runtime grants. Production requires a restricted role.",
  );
  process.exit(0);
}
const ownerUrl = new URL(databaseUrl(process.env, "migration"));
const runtimeUrl = new URL(databaseUrl());
if (
  ownerUrl.host !== runtimeUrl.host ||
  ownerUrl.pathname !== runtimeUrl.pathname ||
  ownerUrl.username === runtimeUrl.username ||
  !settings.DATABASE
)
  throw new Error("Grant helper requires distinct migration/runtime roles on the same database.");
if (
  process.env.LOCAL_POSTGRES === "true" &&
  (ownerUrl.hostname !== "127.0.0.1" || ownerUrl.port !== "54329")
)
  throw new Error("Local grant helper requires the isolated cluster at 127.0.0.1:54329.");

const roleName = decodeURIComponent(runtimeUrl.username);
const roleSql = '"' + roleName.replaceAll('"', '""') + '"';
const databaseSql = '"' + settings.DATABASE.replaceAll('"', '""') + '"';
const client = new pg.Client({ connectionString: ownerUrl.toString() });
await client.connect();
try {
  const { rows } = await client.query(
    "SELECT rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls FROM pg_roles WHERE rolname = $1",
    [roleName],
  );
  if (!rows.length || Object.values(rows[0]).some(Boolean))
    throw new Error("Provision a runtime role without elevated PostgreSQL privileges first.");
  await client.query("BEGIN");
  await client.query("REVOKE CREATE ON SCHEMA public FROM PUBLIC");
  await client.query(`REVOKE ALL ON DATABASE ${databaseSql} FROM PUBLIC`);
  await client.query(`REVOKE ALL ON DATABASE ${databaseSql} FROM ${roleSql}`);
  await client.query(`GRANT CONNECT ON DATABASE ${databaseSql} TO ${roleSql}`);
  await client.query(`REVOKE ALL ON SCHEMA public FROM ${roleSql}`);
  await client.query(`GRANT USAGE ON SCHEMA public TO ${roleSql}`);
  await client.query(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM ${roleSql}`);
  await client.query(
    `GRANT SELECT, INSERT, UPDATE ON "User", "Account", "Resource", "Reservation" TO ${roleSql}`,
  );
  await client.query(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON "Session", "Verification", "RateLimit" TO ${roleSql}`,
  );
  await client.query(`GRANT INSERT ON "AuditEvent" TO ${roleSql}`);
  await client.query(`GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO ${roleSql}`);
  await client.query("COMMIT");
  console.log(
    "Granted runtime table access and insert-only audit access; schema/history deletion remain denied.",
  );
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
