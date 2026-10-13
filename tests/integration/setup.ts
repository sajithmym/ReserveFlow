import pg from "pg";
import { testDatabaseUrl } from "../../scripts/test-database.mjs";

const client = new pg.Client({ connectionString: testDatabaseUrl() });
try {
  await client.connect();
  const { rows } = await client.query<{ elevated: boolean }>(`
    SELECT EXISTS (
      SELECT 1 FROM pg_roles r
      WHERE (r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls
        OR r.rolname IN ('pg_write_server_files', 'pg_read_server_files', 'pg_execute_server_program'))
        AND pg_has_role(current_user, r.oid, 'MEMBER')
    ) AS elevated
  `);
  if (!rows.length || rows[0].elevated)
    throw new Error("Integration tests require a dedicated non-elevated test database identity.");
} finally {
  await client.end();
}
