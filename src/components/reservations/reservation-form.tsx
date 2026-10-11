"use client";
import { useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarCheck2, CheckCircle2, Clock3, Loader2, ShieldCheck } from "lucide-react";
import { availabilityAction, saveReservationAction } from "@/app/actions";
import { fromLocalInput, toLocalInput } from "@/lib/time";
import { TIME_ZONE_LABEL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import type { ActionResult } from "@/lib/errors";

type Booking = { id: string; resourceId: string; title: string; startAt: string; endAt: string };
export function ReservationForm({
  resources,
  selectedResource,
  booking,
  initialStart,
}: {
  resources: { id: string; name: string; category: string }[];
  selectedResource?: string;
  booking?: Booking;
  initialStart: string;
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [availability, setAvailability] = useState<(ActionResult & { available?: boolean }) | null>(
    null,
  );
  const [resourceId, setResourceId] = useState(
    booking?.resourceId ?? selectedResource ?? resources[0]?.id ?? "",
  );
  const [title, setTitle] = useState(booking?.title ?? "");
  const [startAt, setStartAt] = useState(booking ? toLocalInput(booking.startAt) : initialStart);
  const [endAt, setEndAt] = useState(
    booking
      ? toLocalInput(booking.endAt)
      : toLocalInput(new Date(fromLocalInput(initialStart).getTime() + 3600000)),
  );
  const fields = result && !result.ok ? result.fields : undefined;
  const input = { resourceId, title, startAt, endAt };
  async function check() {
    setChecking(true);
    setAvailability(null);
    try {
      setAvailability(
        await availabilityAction(booking?.id ?? null, {
          ...input,
          title: title || "Availability check",
        }),
      );
    } catch {
      setAvailability({
        ok: false,
        code: "INTERNAL_ERROR",
        message: "Could not check availability. Please retry.",
      });
    } finally {
      setChecking(false);
    }
  }
  async function submit() {
    setPending(true);
    setResult(null);
    try {
      const response = await saveReservationAction(booking?.id ?? null, input);
      setResult(response);
      if (response.ok) {
        router.push(`/reservations/${response.id}`);
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
  function changed() {
    setAvailability(null);
    setResult(null);
  }
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_280px]">
      <form
        action={submit}
        className="space-y-6 rounded-xl border border-stone-200 bg-white p-6 md:p-8"
      >
        <fieldset disabled={!hydrated || pending || checking} className="space-y-6">
          <div>
            <h2 className="font-semibold">Make room for your plans</h2>
            <p className="mt-1 text-xs text-stone-500">
              Choose a resource and a time that works for you.
            </p>
          </div>
          <Field name="resourceId" label="Resource" error={fields?.resourceId}>
            <select
              id="resourceId"
              name="resourceId"
              required
              className={inputClass}
              value={resourceId}
              disabled={!!booking}
              onChange={(e) => {
                setResourceId(e.target.value);
                changed();
              }}
            >
              {resources.map((r) => (
                <option value={r.id} key={r.id}>
                  {r.name} · {r.category}
                </option>
              ))}
            </select>
          </Field>
          <Field name="title" label="Purpose of reservation" error={fields?.title}>
            <input
              id="title"
              name="title"
              required
              minLength={3}
              maxLength={160}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setResult(null);
              }}
              placeholder="e.g. Product planning session"
              className={inputClass}
              aria-invalid={!!fields?.title}
              aria-describedby={fields?.title ? "title-error" : undefined}
            />
          </Field>
          <div className="rounded-lg bg-stone-50 p-4">
            <p className="mb-4 flex items-center gap-2 text-xs font-medium text-stone-600">
              <Clock3 size={14} />
              {TIME_ZONE_LABEL}
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field name="startAt" label="Start date & time" error={fields?.startAt}>
                <input
                  id="startAt"
                  name="startAt"
                  type="datetime-local"
                  required
                  value={startAt}
                  onChange={(e) => {
                    setStartAt(e.target.value);
                    changed();
                  }}
                  className={inputClass}
                  aria-describedby={fields?.startAt ? "startAt-error" : undefined}
                />
              </Field>
              <Field name="endAt" label="End date & time" error={fields?.endAt}>
                <input
                  id="endAt"
                  name="endAt"
                  type="datetime-local"
                  required
                  value={endAt}
                  onChange={(e) => {
                    setEndAt(e.target.value);
                    changed();
                  }}
                  className={inputClass}
                  aria-describedby={fields?.endAt ? "endAt-error" : undefined}
                />
              </Field>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={check}
              disabled={checking || pending || !resourceId}
            >
              {checking ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Check availability
            </Button>
            {availability && (
              <p
                role="status"
                className={`max-w-sm pt-1 text-xs leading-5 ${availability.ok && availability.available ? "text-emerald-700" : "text-amber-800"}`}
              >
                {availability.message}
              </p>
            )}
          </div>
          {result && (
            <p
              role={result.ok ? "status" : "alert"}
              className={`rounded-lg p-3 text-sm ${result.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
            >
              {result.message}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3 border-t border-stone-100 pt-5">
            <Button asChild variant="outline">
              <Link href={booking ? `/reservations/${booking.id}` : "/reservations"}>Cancel</Link>
            </Button>
            <Button disabled={pending || !resourceId}>
              {pending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CalendarCheck2 size={16} />
              )}
              {booking ? "Save reservation" : "Confirm reservation"}
            </Button>
          </div>
        </fieldset>
      </form>
      <aside className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-6">
        <ShieldCheck size={26} strokeWidth={1.5} className="mb-4 text-emerald-700" />
        <h2 className="text-sm font-semibold text-emerald-900">A clear schedule for everyone</h2>
        <p className="mt-3 text-xs leading-6 text-stone-600">
          Your reservation is confirmed immediately when the time slot is available. Overlapping
          reservations are automatically prevented.
        </p>
        <div className="mt-5 space-y-3 border-t border-emerald-100 pt-5 text-xs leading-5 text-stone-600">
          <p>Reserve a time in the future.</p>
          <p>Back-to-back reservations are welcome.</p>
          <p>Plans change? Reschedule before the start, or cancel before the end.</p>
        </div>
      </aside>
    </div>
  );
}
