import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { TIME_ZONE } from "@/lib/config";

export function fromLocalInput(value: string): Date {
  return fromZonedTime(value, TIME_ZONE);
}
export function toLocalInput(value: Date | string): string {
  return formatInTimeZone(value, TIME_ZONE, "yyyy-MM-dd'T'HH:mm");
}
export function formatDate(value: Date | string, format = "EEE, d MMM"): string {
  return formatInTimeZone(value, TIME_ZONE, format);
}
export function formatTime(value: Date | string): string {
  return formatDate(value, "h:mm a");
}
export function nextReservationStart(): string {
  return toLocalInput(new Date(Math.ceil((Date.now() + 3600000) / 1800000) * 1800000));
}
export function dayBounds(now: Date) {
  const day = formatDate(now, "yyyy-MM-dd");
  const start = fromLocalInput(`${day}T00:00`);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}
export function overlaps(a: { startAt: Date; endAt: Date }, b: { startAt: Date; endAt: Date }) {
  return a.startAt < b.endAt && a.endAt > b.startAt;
}
