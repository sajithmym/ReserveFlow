import "server-only";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth/guards";
import { idSchema, resourceSchema, type Filters } from "@/lib/validators";
import { AppError } from "@/lib/errors";
import { PAGE_SIZE } from "@/lib/config";
import { Prisma } from "@/generated/prisma/client";

export async function listResources(filters: Filters) {
  const user = await requireUser();
  const now = new Date();
  const where: Prisma.ResourceWhereInput = {
    ...(user.role === "MEMBER" ? { isActive: true } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.q
      ? {
          OR: ["name", "location", "description"].map((key) => ({
            [key]: { contains: filters.q, mode: "insensitive" },
          })),
        }
      : {}),
  };
  const [resources, total, activeTotal] = await Promise.all([
    db.resource.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        reservations: {
          where: { status: "CONFIRMED", startAt: { lte: now }, endAt: { gt: now } },
          select: { id: true },
          take: 1,
        },
      },
    }),
    db.resource.count({ where }),
    db.resource.count({ where: { isActive: true } }),
  ]);
  return {
    resources: resources.map(({ reservations, ...r }) => ({
      ...r,
      isAvailable: r.isActive && reservations.length === 0,
    })),
    total,
    activeTotal,
  };
}
export async function resourceOptions() {
  await requireUser();
  return db.resource.findMany({
    where: { isActive: true },
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
    take: 500,
  });
}
export async function reservationResourceOptions() {
  const user = await requireUser();
  return db.resource.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : { OR: [{ isActive: true }, { reservations: { some: { userId: user.id } } }] },
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
    take: 500,
  });
}
export async function getResource(input: unknown) {
  const user = await requireUser();
  const resource = await db.resource.findFirst({
    where: { id: idSchema.parse(input), ...(user.role === "MEMBER" ? { isActive: true } : {}) },
  });
  if (!resource) throw new AppError("NOT_FOUND", "Resource not found.");
  return resource;
}
export async function createResource(input: unknown) {
  await requireAdmin();
  return db.resource.create({ data: resourceSchema.parse(input) });
}
export async function updateResource(id: unknown, input: unknown) {
  await requireAdmin();
  const resourceId = idSchema.parse(id);
  const data = resourceSchema.parse(input);
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      { id: string }[]
    >`SELECT "id" FROM "Resource" WHERE "id" = ${resourceId}::uuid FOR UPDATE`;
    if (!rows.length) throw new AppError("NOT_FOUND", "Resource not found.");
    return tx.resource.update({ where: { id: resourceId }, data });
  });
}
export async function setResourceActive(id: unknown, isActive: boolean) {
  await requireAdmin();
  const resourceId = idSchema.parse(id);
  if (typeof isActive !== "boolean")
    throw new AppError("VALIDATION_ERROR", "Invalid resource status.");
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      { id: string }[]
    >`SELECT "id" FROM "Resource" WHERE "id" = ${resourceId}::uuid FOR UPDATE`;
    if (!rows.length) throw new AppError("NOT_FOUND", "Resource not found.");
    return tx.resource.update({ where: { id: resourceId }, data: { isActive } });
  });
}
