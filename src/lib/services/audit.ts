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
  await tx.auditEvent.create({
    data: {
      actorId: event.actorId,
      action: event.action,
      entity: event.entity,
      entityId: event.entityId,
      before: event.before,
      after: event.after,
    },
  });
}
