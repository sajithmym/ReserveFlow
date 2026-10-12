import { describe, expect, it } from "vitest";
import { dayBounds, fromLocalInput, overlaps, toLocalInput } from "@/lib/time";
import { filtersSchema, reservationSchema, resourceSchema } from "@/lib/validators";
import { AppError, publicError } from "@/lib/errors";
import { CONFLICT_MESSAGE } from "@/config/settings";

const range = {
  resourceId: "10000000-0000-4000-8000-000000000001",
  title: "Team session",
  startAt: "2030-10-12T09:00",
  endAt: "2030-10-12T10:00",
};
describe("Sri Lanka time and intervals", () => {
  it("converts wall time to a UTC instant and back", () => {
    const time = fromLocalInput(range.startAt);
    expect(time.toISOString()).toBe("2030-10-12T03:30:00.000Z");
    expect(toLocalInput(time)).toBe(range.startAt);
  });
  it("allows adjacent half-open ranges", () => {
    const first = { startAt: new Date(0), endAt: new Date(1000) };
    expect(overlaps(first, { startAt: new Date(1000), endAt: new Date(2000) })).toBe(false);
    expect(overlaps(first, { startAt: new Date(999), endAt: new Date(2000) })).toBe(true);
  });
  it("computes local day boundaries across UTC midnight", () => {
    const { start, end } = dayBounds(new Date("2030-10-11T20:00:00Z"));
    expect(start.toISOString()).toBe("2030-10-11T18:30:00.000Z");
    expect(end.toISOString()).toBe("2030-10-12T18:30:00.000Z");
  });
  it("accepts cross-midnight bookings", () => {
    const parsed = reservationSchema.parse({
      ...range,
      startAt: "2030-10-12T23:30",
      endAt: "2030-10-13T00:30",
    });
    expect(parsed.endAt.getTime() - parsed.startAt.getTime()).toBe(3600000);
  });
});
describe("boundary validation", () => {
  it("rejects implicit numeric coercion of arrays, booleans, and objects", () => {
    for (const capacity of [true, [4], {}])
      expect(
        resourceSchema.safeParse({ name: "Room", category: "Meeting room", capacity }).success,
      ).toBe(false);
    for (const page of [true, [1], {}])
      expect(filtersSchema.safeParse({ page }).success).toBe(false);
    expect(resourceSchema.parse({ name: "Room", category: "Meeting room" })).toMatchObject({
      capacity: null,
      location: null,
      description: null,
    });
  });
  it.each(["2030-10-12T09:00", "2030-10-12T08:00"])("rejects an invalid end %s", (endAt) => {
    expect(reservationSchema.safeParse({ ...range, endAt }).success).toBe(false);
  });
  it.each(["2030-02-30T09:00", "2030-13-12T09:00", "not-a-date"])(
    "rejects malformed date %s",
    (startAt) => {
      expect(reservationSchema.safeParse({ ...range, startAt }).success).toBe(false);
    },
  );
  it("rejects forged identity and privilege fields", () => {
    expect(
      reservationSchema.safeParse({ ...range, userId: range.resourceId, role: "ADMIN" }).success,
    ).toBe(false);
  });
  it("rejects malformed IDs and huge titles", () => {
    expect(reservationSchema.safeParse({ ...range, resourceId: "bad" }).success).toBe(false);
    expect(reservationSchema.safeParse({ ...range, title: "x".repeat(161) }).success).toBe(false);
  });
  it("requires positive integral resource capacity", () => {
    const resource = {
      name: "Room",
      category: "Meeting room",
      description: "",
      location: "",
      capacity: "0",
    };
    expect(resourceSchema.safeParse(resource).success).toBe(false);
    expect(resourceSchema.parse({ ...resource, capacity: "" }).capacity).toBeNull();
  });
  it("rejects invalid category, status, array filters, and excessive pages", () => {
    for (const filter of [
      { category: "arbitrary" },
      { status: "PENDING" },
      { q: ["one", "two"] },
      { page: 10001 },
    ])
      expect(filtersSchema.safeParse(filter).success).toBe(false);
  });
  it("rejects dates that do not exist", () => {
    expect(filtersSchema.safeParse({ date: "2030-02-30" }).success).toBe(false);
  });
});
describe("safe errors", () => {
  it("recognizes wrapped exclusion violations", () => {
    expect(
      publicError({ meta: { driverAdapterError: { cause: { originalCode: "23P01" } } } }),
    ).toMatchObject({ code: "SLOT_UNAVAILABLE", message: CONFLICT_MESSAGE });
  });
  it("returns expected business errors", () => {
    expect(publicError(new AppError("FORBIDDEN", "Admin only."))).toEqual({
      ok: false,
      code: "FORBIDDEN",
      message: "Admin only.",
    });
  });
});
