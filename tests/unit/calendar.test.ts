import { describe, expect, it } from "vitest";
import { format } from "date-fns";
import { calendarDate, calendarDays } from "@/lib/time/calendar";
describe("calendar date handling", () => {
  it("rejects impossible and partial dates without timezone conversion", () => {
    for (const input of ["2030-02-30", "2030-13-01", "2030-1-01", "", "invalid"])
      expect(calendarDate(input)).toBeNull();
    expect(format(calendarDate("2028-02-29")!, "yyyy-MM-dd")).toBe("2028-02-29");
  });
  it("builds six Monday-start weeks across month/year boundaries", () => {
    const days = calendarDays(calendarDate("2030-01-15")!);
    expect(days).toHaveLength(42);
    expect(days[0].getDay()).toBe(1);
    expect(format(days[0], "yyyy-MM-dd")).toBe("2029-12-31");
    expect(format(days.at(-1)!, "yyyy-MM-dd")).toBe("2030-02-10");
  });
});
