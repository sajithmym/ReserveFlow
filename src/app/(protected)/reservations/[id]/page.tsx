import { DATE_FORMATS, TIME_ZONE_LABEL } from "@/config/settings";
import { requirePageUser } from "@/lib/auth/guards";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, MapPin, Pencil, UserRound } from "lucide-react";
import { getReservation } from "@/lib/services/reservations";
import { pageRecord } from "@/lib/services/page-record";
import { formatDate, formatTime } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { ResourceVisual } from "@/components/resources/resource-visual";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageUser();
  const { id } = await params;
  const booking = await pageRecord(() => getReservation(id));
  const now = new Date();
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/reservations"
        className="mb-6 inline-flex items-center gap-2 text-xs text-stone-500"
      >
        <ArrowLeft size={14} />
        Back to reservations
      </Link>
      <div className="rounded-xl border border-stone-200 bg-white p-6 md:p-8">
        <div className="mb-5 flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-stone-400 uppercase">
            Reservation details
          </span>
          <StatusBadge
            label={
              booking.status === "CANCELLED"
                ? "Cancelled"
                : booking.endAt <= now
                  ? "Completed"
                  : booking.startAt <= now
                    ? "In progress"
                    : "Confirmed"
            }
            tone={booking.status === "CANCELLED" || booking.endAt <= now ? "neutral" : "green"}
          />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{booking.title}</h1>
        <div className="mt-7 flex items-center gap-3 rounded-lg bg-stone-50 p-4">
          <ResourceVisual category={booking.resource.category} compact />
          <div>
            <p className="text-sm font-semibold">{booking.resource.name}</p>
            <p className="mt-1 text-xs text-stone-500">{booking.resource.category}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          {[
            {
              label: "Start",
              value: `${formatDate(booking.startAt, DATE_FORMATS.dateWithYear)} · ${formatTime(booking.startAt)}`,
              icon: CalendarDays,
            },
            {
              label: "End",
              value: `${formatDate(booking.endAt, DATE_FORMATS.dateWithYear)} · ${formatTime(booking.endAt)}`,
              icon: Clock3,
            },
            { label: "Reserved by", value: booking.user.name, icon: UserRound },
            {
              label: "Location",
              value: booking.resource.location || "Not specified",
              icon: MapPin,
            },
          ].map((detail) => (
            <div key={detail.label}>
              <dt className="mb-2 flex items-center gap-2 text-xs text-stone-500">
                <detail.icon size={14} />
                {detail.label}
              </dt>
              <dd className="text-sm font-medium text-stone-700">{detail.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-[11px] text-stone-400">
          {TIME_ZONE_LABEL}. Created {formatDate(booking.createdAt, DATE_FORMATS.shortDateWithYear)}
          .
        </p>
        {!booking.resource.isActive && (
          <p className="mt-5 rounded-lg bg-amber-50 p-4 text-xs leading-5 text-amber-800">
            This resource is currently inactive. Your reservation is retained; contact an
            administrator to coordinate access.
          </p>
        )}
        <div className="mt-7 flex flex-wrap items-start gap-3 border-t border-stone-100 pt-6">
          {booking.status === "CONFIRMED" && booking.startAt > now && booking.resource.isActive && (
            <Button asChild>
              <Link href={`/reservations/${id}/edit`}>
                <Pencil size={15} />
                Reschedule
              </Link>
            </Button>
          )}
          {booking.status === "CONFIRMED" && booking.endAt > now && (
            <ConfirmAction kind="reservation" id={id} />
          )}
          <Button asChild variant="outline">
            <Link href="/reservations">All reservations</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
