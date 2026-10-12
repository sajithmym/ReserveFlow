import "server-only";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { lockActor } from "@/lib/auth/transaction-actor";
import { filtersSchema, idSchema, reservationSchema, type Filters } from "@/lib/validators";
import { AppError } from "@/lib/errors";
import { PAGE_SIZE, LIMITS } from "@/config/settings";
import { fromLocalInput } from "@/lib/time";
import { Prisma } from "@/generated/prisma/client";
import { getResource } from "./resources";
import { recordAudit } from "./audit";

const include = { resource: true, user: { select: { name: true } } } as const;
function auditSnapshot(booking: {
  id: string;
  resourceId: string;
  userId: string;
  title: string;
  startAt: Date;
  endAt: Date;
  status: string;
}) {
  return {
    id: booking.id,
    resourceId: booking.resourceId,
    userId: booking.userId,
    title: booking.title,
    startAt: booking.startAt.toISOString(),
    endAt: booking.endAt.toISOString(),
    status: booking.status,
  };
}
function future(startAt: Date) {
  if (startAt <= new Date())
    throw new AppError("VALIDATION_ERROR", "Start time must be in the future.");
}
async function lockResource(tx: Prisma.TransactionClient, id: string, needsActive = true) {
  const rows = await tx.$queryRaw<
    { id: string; isActive: boolean }[]
  >`SELECT "id", "isActive" FROM "Resource" WHERE "id" = ${id}::uuid FOR UPDATE`;
  if (!rows.length) throw new AppError("NOT_FOUND", "Resource not found.");
  if (needsActive && !rows[0].isActive)
    throw new AppError(
      "RESOURCE_INACTIVE",
      "This resource is inactive and cannot accept reservations.",
    );
}
export async function listReservations(input: Filters) {
  const user = await requireUser();
  const filters = filtersSchema.parse(input);
  if (filters.memberId && user.role !== "ADMIN")
    throw new AppError("FORBIDDEN", "Only administrators can filter by member.");
  const dateStart = filters.date ? fromLocalInput(`${filters.date}T00:00`) : undefined;
  const where: Prisma.ReservationWhereInput = {
    ...(user.role === "MEMBER" ? { userId: user.id } : {}),
    ...(user.role === "ADMIN" && filters.memberId ? { userId: filters.memberId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.resourceId ? { resourceId: filters.resourceId } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { resource: { name: { contains: filters.q, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(dateStart
      ? { startAt: { lt: new Date(dateStart.getTime() + 86400000) }, endAt: { gt: dateStart } }
      : {}),
  };
  const [reservations, total] = await Promise.all([
    db.reservation.findMany({
      where,
      include,
      orderBy: { startAt: "desc" },
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.reservation.count({ where }),
  ]);
  return { reservations, total };
}
export async function getReservation(input: unknown) {
  const user = await requireUser();
  const booking = await db.reservation.findFirst({
    where: { id: idSchema.parse(input), ...(user.role === "MEMBER" ? { userId: user.id } : {}) },
    include,
  });
  if (!booking) throw new AppError("NOT_FOUND", "Reservation not found.");
  return booking;
}
export async function createReservation(input: unknown) {
  const user = await requireUser();
  const data = reservationSchema.parse(input);
  future(data.startAt);
  return db.$transaction(async (tx) => {
    await lockActor(tx, user.id);
    await lockResource(tx, data.resourceId);
    future(data.startAt);
    const reservation = await tx.reservation.create({ data: { ...data, userId: user.id } });
    await recordAudit(tx, {
      actorId: user.id,
      action: "RESERVATION_CREATE",
      entity: "RESERVATION",
      entityId: reservation.id,
      after: auditSnapshot(reservation),
    });
    return reservation;
  });
}
export async function updateReservation(id: unknown, input: unknown) {
  const user = await requireUser();
  const bookingId = idSchema.parse(id);
  const data = reservationSchema.parse(input);
  future(data.startAt);
  return db.$transaction(async (tx) => {
    const actor = await lockActor(tx, user.id);
    const scope = { id: bookingId, ...(actor.role === "MEMBER" ? { userId: actor.id } : {}) };
    const original = await tx.reservation.findFirst({ where: scope });
    if (!original) throw new AppError("NOT_FOUND", "Reservation not found.");
    if (original.resourceId !== data.resourceId)
      throw new AppError(
        "VALIDATION_ERROR",
        "The resource cannot change when rescheduling. Create a new reservation instead.",
      );
    await lockResource(tx, original.resourceId);
    await tx.$queryRaw`SELECT "id" FROM "Reservation" WHERE "id" = ${bookingId}::uuid FOR UPDATE`;
    const current = await tx.reservation.findFirstOrThrow({ where: scope });
    if (current.status !== "CONFIRMED" || current.startAt <= new Date())
      throw new AppError("INVALID_STATE", "Only future confirmed reservations can be rescheduled.");
    future(data.startAt);
    const reservation = await tx.reservation.update({ where: { id: bookingId }, data });
    await recordAudit(tx, {
      actorId: user.id,
      action: "RESERVATION_UPDATE",
      entity: "RESERVATION",
      entityId: reservation.id,
      before: auditSnapshot(current),
      after: auditSnapshot(reservation),
    });
    return reservation;
  });
}
export async function cancelReservation(id: unknown) {
  const user = await requireUser();
  const bookingId = idSchema.parse(id);
  return db.$transaction(async (tx) => {
    const actor = await lockActor(tx, user.id);
    const scope = { id: bookingId, ...(actor.role === "MEMBER" ? { userId: actor.id } : {}) };
    const original = await tx.reservation.findFirst({ where: scope });
    if (!original) throw new AppError("NOT_FOUND", "Reservation not found.");
    await lockResource(tx, original.resourceId, false);
    await tx.$queryRaw`SELECT "id" FROM "Reservation" WHERE "id" = ${bookingId}::uuid FOR UPDATE`;
    const current = await tx.reservation.findFirstOrThrow({ where: scope });
    if (current.status === "CANCELLED") return current;
    if (current.endAt <= new Date())
      throw new AppError("INVALID_STATE", "Completed reservations cannot be cancelled.");
    const reservation = await tx.reservation.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });
    await recordAudit(tx, {
      actorId: user.id,
      action: "RESERVATION_CANCEL",
      entity: "RESERVATION",
      entityId: reservation.id,
      before: auditSnapshot(current),
      after: auditSnapshot(reservation),
    });
    return reservation;
  });
}
export async function checkAvailability(input: unknown) {
  await requireUser();
  const data = reservationSchema.safeParse(input);
  if (!data.success) throw data.error;
  future(data.data.startAt);
  const resource = await getResource(data.data.resourceId);
  if (!resource.isActive) throw new AppError("RESOURCE_INACTIVE", "This resource is inactive.");
  const conflict = await db.reservation.findFirst({
    where: {
      resourceId: resource.id,
      status: "CONFIRMED",
      startAt: { lt: data.data.endAt },
      endAt: { gt: data.data.startAt },
    },
    select: { id: true },
  });
  return !conflict;
}
// Availability reveals only occupied intervals, never another member's private details.
export async function resourceSchedule(id: unknown) {
  const resource = await getResource(id);
  const now = new Date();
  return db.reservation.findMany({
    where: {
      resourceId: resource.id,
      status: "CONFIRMED",
      endAt: { gt: now },
      startAt: { lt: new Date(now.getTime() + LIMITS.scheduleDays * 86400000) },
    },
    select: { startAt: true, endAt: true },
    orderBy: { startAt: "asc" },
    take: LIMITS.scheduleEntries,
  });
}

export async function checkEditAvailability(id: unknown, input: unknown) {
  const booking = await getReservation(id);
  const data = reservationSchema.parse(input);
  future(data.startAt);
  if (data.resourceId !== booking.resourceId)
    throw new AppError("VALIDATION_ERROR", "Select the existing resource.");
  const resource = await getResource(data.resourceId);
  if (!resource.isActive) throw new AppError("RESOURCE_INACTIVE", "This resource is inactive.");
  return !(await db.reservation.findFirst({
    where: {
      id: { not: booking.id },
      resourceId: resource.id,
      status: "CONFIRMED",
      startAt: { lt: data.endAt },
      endAt: { gt: data.startAt },
    },
    select: { id: true },
  }));
}
export type ReservationWithResource = Prisma.ReservationGetPayload<{ include: typeof include }>;
