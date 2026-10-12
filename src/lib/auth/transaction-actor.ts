import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";

// A shared actor-row lock serializes writes with deactivation and role changes.
// Acquire this before resource/reservation locks throughout the services.
export async function lockActor(tx: Prisma.TransactionClient, actorId: string, admin = false) {
  const [actor] = await tx.$queryRaw<{ id: string; role: "ADMIN" | "MEMBER"; isActive: boolean }[]>`
    SELECT "id", "role", "isActive" FROM "User" WHERE "id" = ${actorId}::uuid FOR SHARE
  `;
  if (!actor?.isActive) throw new AppError("UNAUTHENTICATED", "Please sign in to continue.");
  if (admin && actor.role !== "ADMIN")
    throw new AppError("FORBIDDEN", "Administrator access is required.");
  return actor;
}
