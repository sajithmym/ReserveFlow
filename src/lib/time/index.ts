import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { TIME_ZONE, DATE_FORMATS, BOOKING_DEFAULTS } from "@/config/settings";

export function fromLocalInput(value: string): Date {
  return fromZonedTime(value, TIME_ZONE);
}
export function toLocalInput(value: Date | string): string {
  return formatInTimeZone(value, TIME_ZONE, DATE_FORMATS.input);
}
export function formatDate(value: Date | string, format: string = DATE_FORMATS.date): string {
  return formatInTimeZone(value, TIME_ZONE, format);
}
export function formatTime(value: Date | string): string {
  return formatDate(value, DATE_FORMATS.time);
}
export function nextReservationStart(): string {
  return toLocalInput(
    new Date(
      Math.ceil(
        (Date.now() + BOOKING_DEFAULTS.leadMinutes * 60000) /
          (BOOKING_DEFAULTS.roundingMinutes * 60000),
      ) *
        BOOKING_DEFAULTS.roundingMinutes *
        60000,
    ),
  );
}
export function dayBounds(now: Date) {
  const day = formatDate(now, DATE_FORMATS.dateInput);
  const start = fromLocalInput(`${day}T00:00`);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}
export function overlaps(a: { startAt: Date; endAt: Date }, b: { startAt: Date; endAt: Date }) {
  return a.startAt < b.endAt && a.endAt > b.startAt;
}
