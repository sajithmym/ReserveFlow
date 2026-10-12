import { z } from "zod";
import { CATEGORIES, LIMITS, ROLES, RESERVATION_STATUSES } from "@/config/settings";
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
    name: z
      .string()
      .trim()
      .min(LIMITS.nameMin, `Use at least ${LIMITS.nameMin} characters.`)
      .max(LIMITS.name),
    description: optionalText(LIMITS.description),
    category: z.enum(CATEGORIES),
    location: optionalText(LIMITS.location),
    capacity: z
      .union([
        z.literal(""),
        z.number().int().min(1, "Capacity must be positive.").max(LIMITS.capacity),
        z
          .string()
          .max(String(LIMITS.capacity).length)
          .regex(/^\d+$/, "Enter a positive whole number.")
          .transform(Number)
          .pipe(z.number().int().min(1, "Capacity must be positive.").max(LIMITS.capacity)),
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
    title: z
      .string()
      .trim()
      .min(LIMITS.purposeMin, `Describe the purpose in at least ${LIMITS.purposeMin} characters.`)
      .max(LIMITS.purpose),
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
    q: z.string().trim().max(LIMITS.search).default(""),
    category: z.union([z.literal(""), z.enum(CATEGORIES)]).default(""),
    status: z.enum(["", ...RESERVATION_STATUSES]).default(""),
    memberId: z.union([z.literal(""), idSchema]).default(""),
    role: z.enum(["", ...ROLES]).default(""),
    active: z.enum(["", "active", "inactive"]).default(""),
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
      (value) =>
        typeof value === "string" &&
        value.length <= String(LIMITS.maxPage).length &&
        /^\d+$/.test(value)
          ? Number(value)
          : value,
      z.number().int().min(1).max(LIMITS.maxPage).default(1),
    ),
  })
  .strict();
export type Filters = z.infer<typeof filtersSchema>;
export function parseFilters(input: Record<string, string | string[] | undefined>): Filters {
  const allowed = Object.keys(filtersSchema.shape);
  return filtersSchema.parse(
    Object.fromEntries(allowed.filter((k) => input[k] !== undefined).map((k) => [k, input[k]])),
  );
}

export const memberSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(LIMITS.nameMin, `Use at least ${LIMITS.nameMin} characters.`)
      .max(LIMITS.name),
    email: z
      .string()
      .trim()
      .max(LIMITS.email)
      .pipe(z.email("Enter a valid email address."))
      .transform((v) => v.toLowerCase()),
    role: z.enum(ROLES),
    isActive: z.boolean(),
    password: z
      .union([
        z.literal(""),
        z
          .string()
          .min(LIMITS.passwordMin, `Use at least ${LIMITS.passwordMin} characters.`)
          .max(LIMITS.passwordMax),
      ])
      .default(""),
  })
  .strict();
export const newMemberSchema = memberSchema.refine((v) => v.password.length >= LIMITS.passwordMin, {
  message: `A password of at least ${LIMITS.passwordMin} characters is required.`,
  path: ["password"],
});
export const activeSchema = z.boolean();
