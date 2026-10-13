import "server-only";
import { db } from "@/lib/db";
import { isLocalPostgresDevelopment } from "@/lib/db/config.mjs";

export async function assertRuntimePermissions() {
  const [role] = await db.$queryRaw<
    {
      elevated: boolean;
      ownsTables: boolean;
      canChangeSchema: boolean;
      canDeleteHistory: boolean;
      canChangeAudit: boolean;
      canWriteAudit: boolean;
      canThrottle: boolean;
    }[]
  >`
    SELECT
      EXISTS (
        SELECT 1 FROM pg_roles elevated
        WHERE (elevated.rolsuper OR elevated.rolcreatedb OR elevated.rolcreaterole
          OR elevated.rolreplication OR elevated.rolbypassrls
          OR elevated.rolname IN ('pg_write_server_files', 'pg_read_server_files', 'pg_execute_server_program'))
          AND pg_has_role(current_user, elevated.oid, 'MEMBER')
      ) AS "elevated",
      EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r'
          AND pg_has_role(current_user, c.relowner, 'MEMBER')
      ) AS "ownsTables",
      (has_database_privilege(current_user, current_database(), 'CREATE')
        OR has_schema_privilege(current_user, 'public', 'CREATE')) AS "canChangeSchema",
      (has_table_privilege(current_user, '"Reservation"', 'DELETE')
        OR has_table_privilege(current_user, '"Reservation"', 'TRUNCATE')
        OR has_table_privilege(current_user, '"Resource"', 'DELETE')
        OR has_table_privilege(current_user, '"Resource"', 'TRUNCATE')
        OR has_table_privilege(current_user, '"User"', 'DELETE')
        OR has_table_privilege(current_user, '"User"', 'TRUNCATE')) AS "canDeleteHistory",
      (has_table_privilege(current_user, '"AuditEvent"', 'UPDATE')
        OR has_table_privilege(current_user, '"AuditEvent"', 'DELETE')
        OR has_table_privilege(current_user, '"AuditEvent"', 'TRUNCATE')) AS "canChangeAudit",
      has_table_privilege(current_user, '"AuditEvent"', 'INSERT') AS "canWriteAudit",
      (has_table_privilege(current_user, '"RateLimit"', 'SELECT')
        AND has_table_privilege(current_user, '"RateLimit"', 'INSERT')
        AND has_table_privilege(current_user, '"RateLimit"', 'UPDATE')
        AND has_table_privilege(current_user, '"RateLimit"', 'DELETE')) AS "canThrottle"
    FROM pg_roles r WHERE r.rolname = current_user
  `;
  // Explicit local postgres development mode uses the developer's existing service.
  // Production and every other identity retain the restricted-role checks.
  if (role && isLocalPostgresDevelopment()) return;
  if (
    !role ||
    role.elevated ||
    role.ownsTables ||
    role.canChangeSchema ||
    role.canDeleteHistory ||
    role.canChangeAudit
  )
    throw new Error(
      "The application database role has excessive permissions. Provision a dedicated restricted runtime role.",
    );
  if (!role.canWriteAudit || !role.canThrottle)
    throw new Error(
      "The runtime role is missing audit/rate-limit permissions. Apply migrations and run npm run db:grant.",
    );
}
