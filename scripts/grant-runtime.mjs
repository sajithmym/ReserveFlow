import "dotenv/config";
import pg from "pg";

const ownerUrl = new URL(process.env.MIGRATION_DATABASE_URL ?? "");
const runtimeUrl = new URL(process.env.DATABASE_URL ?? "");
if (
  ownerUrl.host !== runtimeUrl.host ||
  ownerUrl.pathname !== runtimeUrl.pathname ||
  ownerUrl.username === runtimeUrl.username ||
  runtimeUrl.pathname !== "/reserveflow"
)
  throw new Error(
    "Grant helper requires distinct owner/runtime roles on the same reserveflow database.",
  );
if (
  process.env.LOCAL_POSTGRES === "true" &&
  (ownerUrl.hostname !== "127.0.0.1" || ownerUrl.port !== "54329")
)
  throw new Error("Local grant helper requires the isolated cluster at 127.0.0.1:54329.");

const roleName = decodeURIComponent(runtimeUrl.username);
const roleSql = '"' + roleName.replaceAll('"', '""') + '"';
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
  await client.query("REVOKE ALL ON DATABASE reserveflow FROM PUBLIC");
  await client.query(`REVOKE ALL ON DATABASE reserveflow FROM ${roleSql}`);
  await client.query(`GRANT CONNECT ON DATABASE reserveflow TO ${roleSql}`);
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
