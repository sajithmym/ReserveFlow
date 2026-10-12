import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from "vitest";
import { verify } from "@node-rs/argon2";
import { AppError } from "@/lib/errors";
const state = vi.hoisted(() => ({
  actor: null as null | { id: string; role: "ADMIN" | "MEMBER"; isActive: boolean },
}));
vi.mock("@/lib/auth/guards", () => ({
  requireAdmin: async () => {
    if (!state.actor?.isActive) throw new AppError("UNAUTHENTICATED", "Sign in required.");
    if (state.actor.role !== "ADMIN")
      throw new AppError("FORBIDDEN", "Administrator access is required.");
    return state.actor;
  },
}));
import { db } from "@/lib/db";
import {
  createMember,
  updateMember,
  getMember,
  listMembers,
  setMemberActive,
  archiveMember,
  memberOptions,
} from "@/lib/services/members";
import { filtersSchema } from "@/lib/validators";

const adminId = randomUUID(),
  secondAdminId = randomUUID(),
  resourceId = randomUUID();
const ids = new Set<string>([adminId, secondAdminId]);
const password = `Test-only-${randomUUID()}`;
const input = (overrides = {}) => ({
  name: "Integration teammate",
  email: `${randomUUID()}@test.local`,
  password,
  role: "MEMBER",
  isActive: true,
  ...overrides,
});
async function provision(overrides = {}) {
  const member = await createMember(input(overrides));
  ids.add(member.id);
  return member;
}
beforeAll(async () => {
  await db.user.createMany({
    data: [adminId, secondAdminId].map((id) => ({
      id,
      email: `${id}@test.local`,
      name: "Integration admin",
      role: "ADMIN" as const,
    })),
  });
  await db.resource.create({
    data: { id: resourceId, name: "Member history fixture", category: "Meeting room" },
  });
});
beforeEach(async () => {
  await db.user.updateMany({
    where: { id: { in: [adminId, secondAdminId] } },
    data: { role: "ADMIN", isActive: true },
  });
  state.actor = { id: adminId, role: "ADMIN", isActive: true };
});
afterAll(async () => {
  await db.reservation.deleteMany({ where: { resourceId } });
  await db.resource.delete({ where: { id: resourceId } });
  await db.auditEvent.deleteMany({ where: { actorId: { in: [adminId, secondAdminId] } } });
  await db.user.deleteMany({ where: { id: { in: [...ids] } } });
  await db.$disconnect();
});
describe("member management against isolated PostgreSQL", () => {
  it("denies anonymous and member reads and writes", async () => {
    for (const actor of [null, { id: adminId, role: "MEMBER" as const, isActive: true }]) {
      state.actor = actor;
      for (const operation of [
        () => listMembers(filtersSchema.parse({})),
        () => getMember(adminId),
        () => memberOptions(),
        () => createMember(input()),
        () => updateMember(adminId, input()),
        () => setMemberActive(adminId, false),
        () => archiveMember(adminId),
      ])
        await expect(operation()).rejects.toMatchObject({
          code: actor ? "FORBIDDEN" : "UNAUTHENTICATED",
        });
    }
  });
  it("creates a hashed credential account and returns only safe member data", async () => {
    const member = await provision({ email: `${randomUUID()}@TEST.LOCAL` });
    expect(member.email).toBe(member.email.toLowerCase());
    expect(member).not.toHaveProperty("password");
    expect(member).not.toHaveProperty("accounts");
    const account = await db.account.findFirstOrThrow({ where: { userId: member.id } });
    expect(account.providerId).toBe("credential");
    expect(await verify(account.password!, password)).toBe(true);
    expect((await getMember(member.id)).id).toBe(member.id);
  });
  it("validates passwords, role/status types and forged fields before creating anything", async () => {
    for (const invalid of [
      { password: "short" },
      { role: "OWNER" },
      { isActive: "false" },
      { userId: adminId },
    ])
      await expect(createMember(input(invalid))).rejects.toHaveProperty("name", "ZodError");
    await expect(getMember("invalid")).rejects.toHaveProperty("name", "ZodError");
    await expect(setMemberActive(randomUUID(), false)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("rejects duplicate email atomically and searches/filters persistent members", async () => {
    const member = await provision();
    await expect(createMember(input({ email: member.email.toUpperCase() }))).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    expect(await db.user.count({ where: { email: member.email } })).toBe(1);
    const result = await listMembers(
      filtersSchema.parse({ q: member.email, role: "MEMBER", active: "active" }),
    );
    expect(result.total).toBe(1);
    expect(result.members[0].id).toBe(member.id);
    expect(
      (await listMembers(filtersSchema.parse({ q: member.email, active: "inactive" }))).total,
    ).toBe(0);
  });
  it("updates role and password, revokes sessions, and retains a blank password", async () => {
    const member = await provision();
    await db.session.create({
      data: { userId: member.id, token: randomUUID(), expiresAt: new Date(Date.now() + 3600000) },
    });
    const newPassword = `Changed-${randomUUID()}`;
    await updateMember(member.id, {
      ...input(),
      email: member.email,
      role: "ADMIN",
      password: newPassword,
    });
    expect(await db.session.count({ where: { userId: member.id } })).toBe(0);
    const account = await db.account.findFirstOrThrow({ where: { userId: member.id } });
    expect(await verify(account.password!, newPassword)).toBe(true);
    await updateMember(member.id, {
      name: "Renamed teammate",
      email: member.email,
      role: "ADMIN",
      isActive: true,
      password: "",
    });
    expect((await db.account.findUniqueOrThrow({ where: { id: account.id } })).password).toBe(
      account.password,
    );
  });
  it("archives and reactivates without deleting reservations or freeing booked slots", async () => {
    const member = await provision();
    await db.session.create({
      data: { userId: member.id, token: randomUUID(), expiresAt: new Date(Date.now() + 3600000) },
    });
    const booking = await db.reservation.create({
      data: {
        userId: member.id,
        resourceId,
        title: "Retained history",
        startAt: new Date(Date.now() + 86400000),
        endAt: new Date(Date.now() + 90000000),
      },
    });
    await archiveMember(member.id);
    expect((await getMember(member.id)).isActive).toBe(false);
    expect(await db.session.count({ where: { userId: member.id } })).toBe(0);
    expect((await db.reservation.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe(
      "CONFIRMED",
    );
    await setMemberActive(member.id, true);
    expect((await getMember(member.id)).isActive).toBe(true);
  });
  it("prevents concurrent changes from removing both active admins", async () => {
    // Other test-created admins must be inactive for this invariant scenario.
    await db.user.updateMany({
      where: { id: { in: [...ids].filter((id) => id !== adminId && id !== secondAdminId) } },
      data: { isActive: false },
    });
    const results = await Promise.allSettled([
      setMemberActive(adminId, false),
      setMemberActive(secondAdminId, false),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      await db.user.count({
        where: { id: { in: [adminId, secondAdminId] }, role: "ADMIN", isActive: true },
      }),
    ).toBe(1);
    const remaining = await db.user.findFirstOrThrow({
      where: { id: { in: [adminId, secondAdminId] }, isActive: true },
    });
    state.actor = { id: remaining.id, role: "ADMIN", isActive: true };
    await expect(
      updateMember(remaining.id, {
        ...input(),
        email: remaining.email,
        role: "MEMBER",
        password: "",
      }),
    ).rejects.toMatchObject({ code: "INVALID_STATE" });
  });
  it("rechecks administrator authority inside the transaction", async () => {
    await db.user.update({ where: { id: adminId }, data: { role: "MEMBER" } });
    await expect(createMember(input())).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
