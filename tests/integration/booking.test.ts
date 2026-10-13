import { testDatabaseUrl } from "../../scripts/test-database.mjs";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { AppError, publicError } from "@/lib/errors";
import { toLocalInput } from "@/lib/time";

const state = vi.hoisted(() => ({
  actor: null as null | {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "MEMBER";
    isActive: boolean;
  },
}));
vi.mock("@/lib/auth/guards", () => ({
  requireUser: async () => {
    if (!state.actor?.isActive) throw new AppError("UNAUTHENTICATED", "Sign in required.");
    return state.actor;
  },
  requireAdmin: async () => {
    if (!state.actor?.isActive) throw new AppError("UNAUTHENTICATED", "Sign in required.");
    if (state.actor.role !== "ADMIN") throw new AppError("FORBIDDEN", "Admin only.");
    return state.actor;
  },
}));
import { db } from "@/lib/db";
import {
  cancelReservation,
  checkAvailability,
  createReservation,
  getReservation,
  listReservations,
  updateReservation,
} from "@/lib/services/reservations";
import {
  createResource,
  getResource,
  listResources,
  setResourceActive,
  updateResource,
} from "@/lib/services/resources";
import { filtersSchema } from "@/lib/validators";

const memberId = randomUUID(),
  otherId = randomUUID(),
  resourceId = randomUUID(),
  secondId = randomUUID();
const actor = {
  id: memberId,
  name: "Integration member",
  email: `${memberId}@test.local`,
  role: "MEMBER" as const,
  isActive: true,
};
const extraResources: string[] = [];
const base = Math.ceil((Date.now() + 86400000 * 10) / 3600000) * 3600000;
const input = (offset = 0, duration = 60, id = resourceId) => ({
  resourceId: id,
  title: "Integration booking",
  startAt: toLocalInput(new Date(base + offset * 60000)),
  endAt: toLocalInput(new Date(base + (offset + duration) * 60000)),
});
beforeAll(async () => {
  await db.user.createMany({
    data: [{ ...actor }, { id: otherId, email: `${otherId}@test.local`, name: "Other member" }],
  });
  await db.resource.createMany({
    data: [
      { id: resourceId, name: "Integration room A", category: "Meeting room" },
      { id: secondId, name: "Integration room B", category: "Meeting room" },
    ],
  });
});
beforeEach(async () => {
  state.actor = actor;
  await db.user.update({ where: { id: memberId }, data: { isActive: true, role: "MEMBER" } });
  await db.reservation.deleteMany({ where: { resourceId: { in: [resourceId, secondId] } } });
  await db.resource.update({ where: { id: resourceId }, data: { isActive: true } });
});
afterAll(async () => {
  await db.reservation.deleteMany({ where: { resourceId: { in: [resourceId, secondId] } } });
  await db.resource.deleteMany({
    where: { id: { in: [resourceId, secondId, ...extraResources] } },
  });
  await db.auditEvent.deleteMany({ where: { actorId: { in: [memberId, otherId] } } });
  await db.user.deleteMany({ where: { id: { in: [memberId, otherId] } } });
  await db.$disconnect();
});

describe("real PostgreSQL booking integrity", () => {
  it("restricts member filtering to administrators without changing booking ownership", async () => {
    const booking = await createReservation(input());
    expect(booking.userId).toBe(memberId);
    await expect(
      db.auditEvent.findFirst({
        where: {
          actorId: memberId,
          entity: "RESERVATION",
          entityId: booking.id,
          action: "RESERVATION_CREATE",
        },
      }),
    ).resolves.toMatchObject({ after: expect.objectContaining({ userId: memberId }) });
    await expect(
      listReservations(filtersSchema.parse({ memberId: otherId })),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    state.actor = { ...actor, role: "ADMIN" };
    expect(
      (await listReservations(filtersSchema.parse({ memberId: memberId }))).reservations.map(
        (r) => r.id,
      ),
    ).toEqual([booking.id]);
    expect((await listReservations(filtersSchema.parse({ memberId: otherId }))).total).toBe(0);
  });
  it("rejects an overlapping confirmed booking with a safe conflict", async () => {
    await createReservation(input());
    await expect(createReservation(input(30))).rejects.toSatisfy(
      (e: unknown) => publicError(e).code === "SLOT_UNAVAILABLE",
    );
  });
  it("allows exact adjacency and different-resource overlaps", async () => {
    await createReservation(input());
    await createReservation(input(60));
    await createReservation(input(30, 60, secondId));
    expect(await db.reservation.count({ where: { userId: memberId } })).toBe(3);
  });
  it("frees cancelled slots and makes repeated cancellation idempotent", async () => {
    const r = await createReservation(input());
    await cancelReservation(r.id);
    expect((await cancelReservation(r.id)).status).toBe("CANCELLED");
    await createReservation(input());
    expect(await db.reservation.count({ where: { resourceId, status: "CONFIRMED" } })).toBe(1);
  });
  it("retains the previous range after a conflicting edit", async () => {
    await createReservation(input());
    const r = await createReservation(input(120));
    await expect(updateReservation(r.id, input(30))).rejects.toSatisfy(
      (e: unknown) => publicError(e).code === "SLOT_UNAVAILABLE",
    );
    expect((await db.reservation.findUniqueOrThrow({ where: { id: r.id } })).startAt).toEqual(
      new Date(base + 120 * 60000),
    );
  });
  it("allows a valid future edit, rejects resource changes and reactivation", async () => {
    const r = await createReservation(input());
    await updateReservation(r.id, input(120));
    await expect(updateReservation(r.id, input(180, 60, secondId))).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    await cancelReservation(r.id);
    await expect(updateReservation(r.id, input(180))).rejects.toMatchObject({
      code: "INVALID_STATE",
    });
  });
  it("rejects past starts and inactive resources", async () => {
    await expect(
      createReservation({ ...input(), startAt: "2000-01-01T09:00", endAt: "2000-01-01T10:00" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await db.resource.update({ where: { id: resourceId }, data: { isActive: false } });
    await expect(createReservation(input())).rejects.toMatchObject({ code: "RESOURCE_INACTIVE" });
  });
  it("rejects ended cancellation and ongoing rescheduling", async () => {
    const r = await db.reservation.create({
      data: {
        resourceId,
        userId: memberId,
        title: "Past booking",
        startAt: new Date(Date.now() - 7200000),
        endAt: new Date(Date.now() - 3600000),
      },
    });
    await expect(cancelReservation(r.id)).rejects.toMatchObject({ code: "INVALID_STATE" });
    await expect(updateReservation(r.id, input())).rejects.toMatchObject({ code: "INVALID_STATE" });
  });
  it("checks availability without disclosing private booking details", async () => {
    expect(await checkAvailability(input())).toBe(true);
    await createReservation(input());
    expect(await checkAvailability(input(30))).toBe(false);
    expect(await checkAvailability(input(60))).toBe(true);
  });
  it("enforces the range CHECK even when bypassing the service", async () => {
    await expect(
      db.reservation.create({
        data: {
          resourceId,
          userId: memberId,
          title: "Invalid range",
          startAt: new Date(base),
          endAt: new Date(base),
        },
      }),
    ).rejects.toThrow();
  });
  it("enforces exclusion across independent connections without resource locks", async () => {
    const separate = new PrismaClient({
      adapter: new PrismaPg({ connectionString: testDatabaseUrl() }),
    });
    try {
      for (let run = 0; run < 4; run++) {
        await db.reservation.deleteMany({ where: { resourceId } });
        const data = {
          resourceId,
          userId: memberId,
          title: "Concurrent SQL write",
          startAt: new Date(base),
          endAt: new Date(base + 3600000),
        };
        const results = await Promise.allSettled([
          db.reservation.create({ data }),
          separate.reservation.create({ data }),
        ]);
        expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
        const rejected = results.find((r) => r.status === "rejected");
        expect(rejected?.status === "rejected" && publicError(rejected.reason).code).toBe(
          "SLOT_UNAVAILABLE",
        );
        expect(await db.reservation.count({ where: { resourceId, status: "CONFIRMED" } })).toBe(1);
      }
    } finally {
      await separate.$disconnect();
    }
  });
  it("serializes concurrent service creates", async () => {
    const results = await Promise.allSettled([
      createReservation(input()),
      createReservation(input()),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await db.reservation.count({ where: { resourceId } })).toBe(1);
  });
  it("serializes booking and deactivation with the same resource lock", async () => {
    state.actor = { ...actor, role: "ADMIN" };
    await db.user.update({ where: { id: memberId }, data: { role: "ADMIN" } });
    const results = await Promise.allSettled([
      createReservation(input()),
      setResourceActive(resourceId, false),
    ]);
    expect(results[1].status).toBe("fulfilled");
    expect((await db.resource.findUniqueOrThrow({ where: { id: resourceId } })).isActive).toBe(
      false,
    );
    if (results[0].status === "rejected")
      expect(results[0].reason).toMatchObject({ code: "RESOURCE_INACTIVE" });
    await expect(createReservation(input(120))).rejects.toMatchObject({
      code: "RESOURCE_INACTIVE",
    });
  });
});
describe("authorization-scoped services", () => {
  it("denies anonymous reads and mutations", async () => {
    state.actor = null;
    await expect(listResources(filtersSchema.parse({}))).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    await expect(createReservation(input())).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    await expect(createResource({})).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });
  it("denies member resource creation, edits, and status changes", async () => {
    await expect(createResource({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(updateResource(resourceId, {})).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(setResourceActive(resourceId, false)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("permits administrator resource CRUD and preserves history on deactivation", async () => {
    state.actor = { ...actor, role: "ADMIN" };
    await db.user.update({ where: { id: memberId }, data: { role: "ADMIN" } });
    const data = {
      name: "Admin test room",
      category: "Meeting room",
      capacity: "4",
      location: "Level 1",
      description: "Testing",
    };
    const r = await createResource(data);
    extraResources.push(r.id);
    expect((await updateResource(r.id, { ...data, name: "Renamed room" })).name).toBe(
      "Renamed room",
    );
    const b = await createReservation(input());
    await setResourceActive(resourceId, false);
    expect((await getReservation(b.id)).status).toBe("CONFIRMED");
  });
  it("hides inactive resources from members", async () => {
    await db.resource.update({ where: { id: resourceId }, data: { isActive: false } });
    await expect(getResource(resourceId)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("denies another member's reads, reschedules, and cancellations", async () => {
    const r = await db.reservation.create({
      data: {
        resourceId,
        userId: otherId,
        title: "Private purpose",
        startAt: new Date(base),
        endAt: new Date(base + 3600000),
      },
    });
    await expect(getReservation(r.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(updateReservation(r.id, input(120))).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(cancelReservation(r.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await listReservations(filtersSchema.parse({}))).reservations).toHaveLength(0);
  });
  it("denies forged ownership and oversized input", async () => {
    await expect(createReservation({ ...input(), userId: otherId })).rejects.toThrow();
    await expect(createReservation({ ...input(), title: "x".repeat(161) })).rejects.toThrow();
  });
  it("rejects stale authenticated actors after account deactivation", async () => {
    await db.user.update({ where: { id: memberId }, data: { isActive: false } });
    await expect(createReservation(input())).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect(await db.reservation.count({ where: { resourceId } })).toBe(0);
  });
  it("rechecks administrator status for resource writes and reservation ownership", async () => {
    state.actor = { ...actor, role: "ADMIN" };
    await expect(setResourceActive(resourceId, false)).rejects.toMatchObject({ code: "FORBIDDEN" });
    const otherBooking = await db.reservation.create({
      data: {
        resourceId,
        userId: otherId,
        title: "Other owner",
        startAt: new Date(base),
        endAt: new Date(base + 3600000),
      },
    });
    await expect(cancelReservation(otherBooking.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(updateReservation(otherBooking.id, input(120))).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
