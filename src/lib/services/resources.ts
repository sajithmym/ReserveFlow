import "server-only";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth/guards";
import { idSchema, resourceSchema, type Filters } from "@/lib/validators";
import { AppError } from "@/lib/errors";
import { recordAudit } from "./audit";
import { PAGE_SIZE, LIMITS } from "@/config/settings";
import { Prisma } from "@/generated/prisma/client";

function auditSnapshot(resource: {
  id: string;
  name: string;
  description: string | null;
  category: string;
  location: string | null;
  capacity: number | null;
  isActive: boolean;
}) {
  return {
    id: resource.id,
    name: resource.name,
    description: resource.description,
    category: resource.category,
    location: resource.location,
    capacity: resource.capacity,
    isActive: resource.isActive,
  };
}

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
    take: LIMITS.options,
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
    take: LIMITS.options,
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
  const actor = await requireAdmin();
  const data = resourceSchema.parse(input);
  return db.$transaction(async (tx) => {
    const resource = await tx.resource.create({ data });
    await recordAudit(tx, {
      actorId: actor.id,
      action: "RESOURCE_CREATE",
      entity: "RESOURCE",
      entityId: resource.id,
      after: auditSnapshot(resource),
    });
    return resource;
  });
}
export async function updateResource(id: unknown, input: unknown) {
  const actor = await requireAdmin();
  const resourceId = idSchema.parse(id);
  const data = resourceSchema.parse(input);
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      { id: string }[]
    >`SELECT "id" FROM "Resource" WHERE "id" = ${resourceId}::uuid FOR UPDATE`;
    if (!rows.length) throw new AppError("NOT_FOUND", "Resource not found.");
    const before = await tx.resource.findUniqueOrThrow({ where: { id: resourceId } });
    const resource = await tx.resource.update({ where: { id: resourceId }, data });
    await recordAudit(tx, {
      actorId: actor.id,
      action: "RESOURCE_UPDATE",
      entity: "RESOURCE",
      entityId: resource.id,
      before: auditSnapshot(before),
      after: auditSnapshot(resource),
    });
    return resource;
  });
}
export async function setResourceActive(id: unknown, isActive: boolean) {
  const actor = await requireAdmin();
  const resourceId = idSchema.parse(id);
  if (typeof isActive !== "boolean")
    throw new AppError("VALIDATION_ERROR", "Invalid resource status.");
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      { id: string }[]
    >`SELECT "id" FROM "Resource" WHERE "id" = ${resourceId}::uuid FOR UPDATE`;
    if (!rows.length) throw new AppError("NOT_FOUND", "Resource not found.");
    const before = await tx.resource.findUniqueOrThrow({ where: { id: resourceId } });
    const resource = await tx.resource.update({ where: { id: resourceId }, data: { isActive } });
    await recordAudit(tx, {
      actorId: actor.id,
      action: isActive ? "RESOURCE_ACTIVATE" : "RESOURCE_DEACTIVATE",
      entity: "RESOURCE",
      entityId: resource.id,
      before: auditSnapshot(before),
      after: auditSnapshot(resource),
    });
    return resource;
  });
}
