import "server-only";
import type { Prisma } from "@/generated/prisma/client";

type Snapshot = Record<string, string | number | boolean | null>;

export async function recordAudit(
  tx: Prisma.TransactionClient,
  event: {
    actorId: string;
    action: string;
    entity: string;
    entityId: string;
    before?: Snapshot;
    after?: Snapshot;
  },
) {
  // INSERT without RETURNING preserves insert-only runtime permissions:
  // Prisma's create() would also require SELECT on the private audit snapshots.
  await tx.$executeRaw`
    INSERT INTO "AuditEvent" ("id", "actorId", "action", "entity", "entityId", "before", "after")
    VALUES (${crypto.randomUUID()}::uuid, ${event.actorId}::uuid,
      ${event.action}, ${event.entity}, ${event.entityId}::uuid,
      ${event.before ? JSON.stringify(event.before) : null}::jsonb,
      ${event.after ? JSON.stringify(event.after) : null}::jsonb)
  `;
}
