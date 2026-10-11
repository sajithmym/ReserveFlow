export const APP_NAME = "ReserveFlow";
export const TIME_ZONE = "Asia/Colombo";
export const TIME_ZONE_LABEL = "Sri Lanka time · UTC+05:30";
export const PAGE_SIZE = 12;
export const CATEGORIES = ["Meeting room", "Workspace", "Equipment", "Vehicle", "Other"] as const;
export const CATEGORY_STYLES: Record<string, string> = {
  "Meeting room": "room",
  Workspace: "workspace",
  Equipment: "equipment",
  Vehicle: "vehicle",
  Other: "other",
};
export const CONFLICT_MESSAGE =
  "That resource is booked during the selected time. Try a different time.";
