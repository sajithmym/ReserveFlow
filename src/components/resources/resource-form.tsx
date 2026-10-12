"use client";
import { useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { saveResourceAction } from "@/app/actions";
import { CATEGORIES, CATEGORY_OPTIONS, LIMITS } from "@/config/settings";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import type { ActionResult } from "@/lib/errors";

import { SearchableSelect } from "@/components/ui/searchable-select";

type Initial = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  location: string | null;
  capacity: number | null;
};
export function ResourceForm({ resource }: { resource?: Initial }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const fields = result && !result.ok ? result.fields : undefined;
  async function submit(form: FormData) {
    setPending(true);
    setResult(null);
    try {
      const response = await saveResourceAction(
        resource?.id ?? null,
        Object.fromEntries(
          ["name", "category", "description", "location", "capacity"].map((key) => [
            key,
            form.get(key),
          ]),
        ),
      );
      setResult(response);
      if (response.ok) {
        router.push(`/resources/${response.id}`);
        router.refresh();
      }
    } catch {
      setResult({
        ok: false,
        code: "INTERNAL_ERROR",
        message: "Could not connect. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit(new FormData(event.currentTarget));
      }}
      className="space-y-6 rounded-xl border border-stone-200 bg-white p-6 md:p-8"
    >
      <fieldset disabled={!hydrated || pending} className="space-y-6">
        <div>
          <h2 className="font-semibold">Resource details</h2>
          <p className="mt-1 text-xs text-stone-500">
            Help your team find the right space or equipment.
          </p>
        </div>
        <Field name="name" label="Resource name" error={fields?.name}>
          <input
            id="name"
            name="name"
            required
            minLength={LIMITS.nameMin}
            maxLength={LIMITS.name}
            defaultValue={resource?.name}
            placeholder="e.g. The Boardroom"
            className={inputClass}
            aria-invalid={!!fields?.name}
            aria-describedby={fields?.name ? "name-error" : undefined}
          />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field name="category" label="Category" error={fields?.category}>
            <SearchableSelect
              id="category"
              name="category"
              required
              defaultValue={resource?.category ?? CATEGORIES[0]}
              options={CATEGORY_OPTIONS}
              aria-invalid={!!fields?.category}
              aria-describedby={fields?.category ? "category-error" : undefined}
            />
          </Field>
          <Field name="capacity" label="Capacity (optional)" error={fields?.capacity}>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              max={LIMITS.capacity}
              defaultValue={resource?.capacity ?? ""}
              placeholder="Number of people"
              className={inputClass}
              aria-describedby={fields?.capacity ? "capacity-error" : undefined}
            />
          </Field>
        </div>
        <Field name="location" label="Location (optional)" error={fields?.location}>
          <input
            id="location"
            name="location"
            maxLength={LIMITS.location}
            defaultValue={resource?.location ?? ""}
            placeholder="e.g. Level 2 · East wing"
            className={inputClass}
          />
        </Field>
        <Field name="description" label="Description (optional)" error={fields?.description}>
          <textarea
            id="description"
            name="description"
            maxLength={LIMITS.description}
            rows={4}
            defaultValue={resource?.description ?? ""}
            placeholder="Facilities, collection instructions, or anything useful to know."
            className={`${inputClass} h-auto py-3`}
          />
        </Field>
        {result && (
          <p
            role={result.ok ? "status" : "alert"}
            className={`rounded-lg p-3 text-sm ${result.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
          >
            {result.message}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t border-stone-100 pt-5">
          <Button asChild variant="outline">
            <Link href={resource ? `/resources/${resource.id}` : "/resources"}>Cancel</Link>
          </Button>
          <Button disabled={pending}>
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {resource ? "Save changes" : "Create resource"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
