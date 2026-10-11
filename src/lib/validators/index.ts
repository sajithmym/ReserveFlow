import { z } from "zod";
import { CATEGORIES } from "@/lib/config";
import { fromLocalInput, toLocalInput } from "@/lib/time";

export const idSchema = z.string().uuid("Choose a valid record.");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .default("")
    .transform((v) => v || null);
export const resourceSchema = z
  .object({
    name: z.string().trim().min(2, "Use at least 2 characters.").max(100),
    description: optionalText(1000),
    category: z.enum(CATEGORIES),
    location: optionalText(160),
    capacity: z
      .union([
        z.literal(""),
        z.number().int().min(1, "Capacity must be positive.").max(10000),
        z
          .string()
          .regex(/^\d{1,5}$/, "Enter a positive whole number.")
          .transform(Number)
          .pipe(z.number().int().min(1, "Capacity must be positive.").max(10000)),
      ])
      .default("")
      .transform((v) => (v === "" ? null : v)),
  })
  .strict();
const localTimestamp = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Enter a valid date and time.")
  .refine((v) => {
    const date = fromLocalInput(v);
    return !Number.isNaN(date.getTime()) && toLocalInput(date) === v;
  }, "Enter a real date and time.")
  .transform(fromLocalInput);
export const reservationSchema = z
  .object({
    resourceId: idSchema,
    title: z.string().trim().min(3, "Describe the purpose in at least 3 characters.").max(160),
    startAt: localTimestamp,
    endAt: localTimestamp,
  })
  .strict()
  .refine((v) => v.startAt < v.endAt, {
    message: "End time must be after the start time.",
    path: ["endAt"],
  });
export const filtersSchema = z
  .object({
    q: z.string().trim().max(100).default(""),
    category: z.union([z.literal(""), z.enum(CATEGORIES)]).default(""),
    status: z.enum(["", "CONFIRMED", "CANCELLED"]).default(""),
    resourceId: z.union([z.literal(""), idSchema]).default(""),
    date: z
      .string()
      .regex(/^$|^\d{4}-\d{2}-\d{2}$/)
      .refine(
        (v) =>
          !v ||
          (!Number.isNaN(fromLocalInput(`${v}T00:00`).getTime()) &&
            toLocalInput(fromLocalInput(`${v}T00:00`)).startsWith(v)),
      )
      .default(""),
    page: z.preprocess(
      (value) => (typeof value === "string" && /^\d{1,5}$/.test(value) ? Number(value) : value),
      z.number().int().min(1).max(10000).default(1),
    ),
  })
  .strict();
export type Filters = z.infer<typeof filtersSchema>;
export function parseFilters(input: Record<string, string | string[] | undefined>): Filters {
  const allowed = ["q", "category", "status", "resourceId", "date", "page"];
  return filtersSchema.parse(
    Object.fromEntries(allowed.filter((k) => input[k] !== undefined).map((k) => [k, input[k]])),
  );
}
