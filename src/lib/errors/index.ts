import { z } from "zod";
import { CONFLICT_MESSAGE } from "@/lib/config";

export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RESOURCE_INACTIVE"
  | "SLOT_UNAVAILABLE"
  | "INVALID_STATE"
  | "INTERNAL_ERROR";
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
export type ActionResult =
  | { ok: true; id?: string; message: string }
  | { ok: false; code: ErrorCode; message: string; fields?: Record<string, string[]> };
export function publicError(error: unknown): Exclude<ActionResult, { ok: true }> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  if (error instanceof z.ZodError)
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Please check the highlighted fields.",
      fields: z.flattenError(error).fieldErrors,
    };
  // Prisma's PG driver wraps SQLSTATE in adapter errors. Match the stable constraint name too.
  if (isExclusionViolation(error))
    return { ok: false, code: "SLOT_UNAVAILABLE", message: CONFLICT_MESSAGE };
  console.error("ReserveFlow request failed", {
    traceId: crypto.randomUUID(),
    type: error instanceof Error ? error.name : "Unknown",
  });
  return { ok: false, code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." };
}
export function isExclusionViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as Record<string, unknown>;
  if (record.code === "23P01" || record.sqlState === "23P01" || record.originalCode === "23P01")
    return true;
  if (
    typeof record.message === "string" &&
    record.message.includes("reservation_no_overlap_confirmed")
  )
    return true;
  return [record.cause, record.meta, record.driverAdapterError].some((nested) =>
    isExclusionViolation(nested),
  );
}
