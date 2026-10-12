import { addDays, format, isValid, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { DATE_FORMATS, UI_SETTINGS } from "@/config/settings";

export function calendarDate(value: string) {
  const date = parseISO(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    isValid(date) &&
    format(date, DATE_FORMATS.dateInput) === value
    ? date
    : null;
}
export function calendarDays(month: Date) {
  const first = startOfWeek(startOfMonth(month), { weekStartsOn: UI_SETTINGS.weekStartsOn });
  return Array.from({ length: UI_SETTINGS.calendarDays }, (_, index) => addDays(first, index));
}
