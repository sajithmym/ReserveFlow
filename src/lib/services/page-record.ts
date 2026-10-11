import "server-only";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AppError } from "@/lib/errors";
export async function pageRecord<T>(query: () => Promise<T>): Promise<T> {
  try {
    return await query();
  } catch (error) {
    if (error instanceof z.ZodError || (error instanceof AppError && error.code === "NOT_FOUND"))
      notFound();
    throw error;
  }
}
