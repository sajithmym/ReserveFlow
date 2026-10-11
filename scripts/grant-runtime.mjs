import "dotenv/config";
import pg from "pg";

if (process.env.LOCAL_POSTGRES !== "true")
  throw new Error("This helper is only for the ReserveFlow local cluster.");
const client = new pg.Client({ connectionString: process.env.MIGRATION_DATABASE_URL });
await client.connect();
try {
  await client.query("GRANT CONNECT ON DATABASE reserveflow TO reserveflow_app");
  await client.query("GRANT USAGE ON SCHEMA public TO reserveflow_app");
  await client.query(
    'GRANT SELECT, INSERT, UPDATE ON "User", "Account", "Verification", "Resource", "Reservation" TO reserveflow_app',
  );
  await client.query(
    'GRANT SELECT, INSERT, UPDATE, DELETE ON "Session", "Verification" TO reserveflow_app',
  );
  await client.query("GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO reserveflow_app");
  console.log(
    "Granted runtime access without schema modification or reservation deletion privileges.",
  );
} finally {
  await client.end();
}
