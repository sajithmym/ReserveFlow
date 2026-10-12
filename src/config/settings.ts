// Public application settings only. Secrets belong in server-side environment variables.
export const APP_NAME = "ReserveFlow";
export const TIME_ZONE = "Asia/Colombo";
export const TIME_ZONE_LABEL = "Sri Lanka time · UTC+05:30";
export const UTC_OFFSET_LABEL = "UTC+05:30";
export const PAGE_SIZE = 12;
export const LIMITS = {
  maxPage: 10000,
  options: 500,
  scheduleDays: 7,
  scheduleEntries: 30,
  dashboardEntries: 5,
  search: 100,
  nameMin: 2,
  name: 100,
  description: 1000,
  location: 160,
  capacity: 10000,
  purpose: 160,
  purposeMin: 3,
  email: 254,
  passwordMin: 12,
  passwordMax: 128,
} as const;
export const DATE_FORMATS = {
  input: "yyyy-MM-dd'T'HH:mm",
  dateInput: "yyyy-MM-dd",
  date: "EEE, d MMM",
  time: "h:mm a",
  month: "MMMM yyyy",
  full: "d MMMM yyyy",
  shortMonth: "MMM",
  day: "dd",
  weekday: "EEEE",
  weekdayInitial: "EEEEE",
  shortDate: "d MMM",
  dateWithYear: "EEE, d MMM yyyy",
  shortDateWithYear: "d MMM yyyy",
} as const;
export const BOOKING_DEFAULTS = {
  durationMinutes: 60,
  leadMinutes: 60,
  roundingMinutes: 30,
  startTime: "09:00",
} as const;
export const UI_SETTINGS = {
  locale: "en-GB",
  weekStartsOn: 1,
  calendarDays: 42,
  calendarYearsBefore: 100,
  calendarYearsAfter: 20,
} as const;
export const CATEGORIES = ["Meeting room", "Workspace", "Equipment", "Vehicle", "Other"] as const;
export const CATEGORY_OPTIONS = CATEGORIES.map((value) => ({ value, label: value }));
export const ROLES = ["ADMIN", "MEMBER"] as const;
export const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrator" },
  { value: "MEMBER", label: "Member" },
] as const;
export const RESERVATION_STATUSES = ["CONFIRMED", "CANCELLED"] as const;
export const RESERVATION_STATUS_OPTIONS = [
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;
export const ACTIVE_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;
export const NAVIGATION = [
  { href: "/", label: "Overview", icon: "overview", adminOnly: false },
  { href: "/resources", label: "Resources", icon: "resources", adminOnly: false },
  { href: "/reservations", label: "Reservations", icon: "reservations", adminOnly: false },
  { href: "/members", label: "Members", icon: "members", adminOnly: true },
] as const;
export const CATEGORY_STYLES: Record<string, string> = {
  "Meeting room": "room",
  Workspace: "workspace",
  Equipment: "equipment",
  Vehicle: "vehicle",
  Other: "other",
};
export const CONFLICT_MESSAGE =
  "That resource is booked during the selected time. Try a different time.";
