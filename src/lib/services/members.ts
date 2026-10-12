import "server-only";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { lockActor } from "@/lib/auth/transaction-actor";
import { SECURITY } from "@/config/security";
import { hashPassword } from "@/lib/auth/password";
import {
  activeSchema,
  filtersSchema,
  idSchema,
  memberSchema,
  newMemberSchema,
  type Filters,
} from "@/lib/validators";
import { AppError } from "@/lib/errors";
import { PAGE_SIZE, LIMITS } from "@/config/settings";
import { Prisma } from "@/generated/prisma/client";
import { recordAudit } from "./audit";

// Never return Account or Session data to the browser.
const select = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  _count: { select: { reservations: true } },
} as const;
function auditSnapshot(member: {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  isActive: boolean;
}) {
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    isActive: member.isActive,
  };
}
export async function listMembers(input: Filters) {
  await requireAdmin();
  const filters = filtersSchema.parse(input);
  const where: Prisma.UserWhereInput = {
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.active ? { isActive: filters.active === "active" } : {}),
    ...(filters.q
      ? {
          OR: ["name", "email"].map((field) => ({
            [field]: { contains: filters.q, mode: "insensitive" },
          })),
        }
      : {}),
  };
  const [members, total] = await Promise.all([
    db.user.findMany({
      where,
      select,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.user.count({ where }),
  ]);
  return { members, total };
}
export async function getMember(input: unknown) {
  await requireAdmin();
  const member = await db.user.findUnique({ where: { id: idSchema.parse(input) }, select });
  if (!member) throw new AppError("NOT_FOUND", "Member not found.");
  return member;
}
export async function memberOptions() {
  await requireAdmin();
  return db.user.findMany({
    select: { id: true, name: true, isActive: true },
    orderBy: { name: "asc" },
    take: LIMITS.options,
  });
}
async function lockManagement(tx: Prisma.TransactionClient, actorId: string) {
  // Serialize role/status changes so concurrent requests cannot remove the last admin.
  await tx.$queryRaw`SELECT 1 AS "locked" FROM pg_advisory_xact_lock(${SECURITY.managementLock})`;
  await lockActor(tx, actorId, true);
}
async function protectAdmin(
  tx: Prisma.TransactionClient,
  id: string,
  role: "ADMIN" | "MEMBER",
  isActive: boolean,
) {
  const existing = await tx.user.findUnique({ where: { id }, select });
  if (!existing) throw new AppError("NOT_FOUND", "Member not found.");
  if (existing.role === "ADMIN" && existing.isActive && (role !== "ADMIN" || !isActive)) {
    const others = await tx.user.count({
      where: { id: { not: id }, role: "ADMIN", isActive: true },
    });
    if (!others) throw new AppError("INVALID_STATE", "Keep at least one active administrator.");
  }
  return existing;
}
function duplicateEmail(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
    throw new AppError("VALIDATION_ERROR", "An account already uses this email address.");
  throw error;
}
export async function createMember(input: unknown) {
  const actor = await requireAdmin();
  const { password, ...data } = newMemberSchema.parse(input);
  const encoded = await hashPassword(password);
  try {
    return await db.$transaction(async (tx) => {
      await lockManagement(tx, actor.id);
      const user = await tx.user.create({ data: { ...data, emailVerified: true }, select });
      await tx.account.create({
        data: { userId: user.id, accountId: user.id, providerId: "credential", password: encoded },
      });
      await recordAudit(tx, {
        actorId: actor.id,
        action: "MEMBER_CREATE",
        entity: "USER",
        entityId: user.id,
        after: auditSnapshot(user),
      });
      return user;
    });
  } catch (error) {
    duplicateEmail(error);
  }
}
export async function updateMember(inputId: unknown, input: unknown) {
  const actor = await requireAdmin();
  const id = idSchema.parse(inputId);
  const { password, ...data } = memberSchema.parse(input);
  const encoded = password ? await hashPassword(password) : undefined;
  try {
    return await db.$transaction(async (tx) => {
      await lockManagement(tx, actor.id);
      const existing = await protectAdmin(tx, id, data.role, data.isActive);
      const revoke =
        encoded || !data.isActive || existing.role !== data.role || existing.email !== data.email;
      const member = await tx.user.update({
        where: { id },
        data: {
          ...data,
          ...(revoke ? { sessionsInvalidBefore: new Date() } : {}),
        },
        select,
      });
      if (encoded)
        await tx.account.upsert({
          where: { providerId_accountId: { providerId: "credential", accountId: id } },
          create: { userId: id, accountId: id, providerId: "credential", password: encoded },
          update: { password: encoded },
        });
      if (revoke) await tx.session.deleteMany({ where: { userId: id } });
      await recordAudit(tx, {
        actorId: actor.id,
        action: "MEMBER_UPDATE",
        entity: "USER",
        entityId: member.id,
        before: auditSnapshot(existing),
        after: { ...auditSnapshot(member), passwordChanged: !!encoded },
      });
      return member;
    });
  } catch (error) {
    duplicateEmail(error);
  }
}
export async function setMemberActive(
  inputId: unknown,
  inputActive: unknown,
  action = "MEMBER_STATUS_CHANGE",
) {
  const actor = await requireAdmin();
  const id = idSchema.parse(inputId),
    isActive = activeSchema.parse(inputActive);
  return db.$transaction(async (tx) => {
    await lockManagement(tx, actor.id);
    const existing = await tx.user.findUnique({ where: { id }, select });
    if (!existing) throw new AppError("NOT_FOUND", "Member not found.");
    await protectAdmin(tx, id, existing.role, isActive);
    const member = await tx.user.update({
      where: { id },
      data: {
        isActive,
        ...(!isActive ? { sessionsInvalidBefore: new Date() } : {}),
      },
      select,
    });
    if (!isActive) await tx.session.deleteMany({ where: { userId: id } });
    await recordAudit(tx, {
      actorId: actor.id,
      action,
      entity: "USER",
      entityId: member.id,
      before: auditSnapshot(existing),
      after: auditSnapshot(member),
    });
    return member;
  });
}
// Logical deletion: preserve the identity, email uniqueness, and reservation history.
export async function archiveMember(id: unknown) {
  return setMemberActive(id, false, "MEMBER_ARCHIVE");
}
