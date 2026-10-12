import { DATE_FORMATS, LIMITS, TIME_ZONE_LABEL } from "@/config/settings";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Pencil, Plus, Users } from "lucide-react";
import { requirePageUser } from "@/lib/auth/guards";
import { getResource } from "@/lib/services/resources";
import { resourceSchedule } from "@/lib/services/reservations";
import { pageRecord } from "@/lib/services/page-record";
import { formatDate, formatTime } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { ResourceVisual } from "@/components/resources/resource-visual";

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const { id } = await params;
  const resource = await pageRecord(() => getResource(id));
  const schedule = await resourceSchedule(id);
  return (
    <>
      <Link
        href="/resources"
        className="mb-6 inline-flex items-center gap-2 text-xs text-stone-500 hover:text-emerald-700"
      >
        <ArrowLeft size={14} />
        Back to resources
      </Link>
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <ResourceVisual category={resource.category} />
          <div className="p-6 md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium text-stone-400">{resource.category}</span>
              <StatusBadge
                label={resource.isActive ? "Active resource" : "Inactive resource"}
                tone={resource.isActive ? "green" : "neutral"}
              />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{resource.name}</h1>
            <div className="mt-5 flex flex-wrap gap-5 text-sm text-stone-500">
              <span className="flex items-center gap-2">
                <MapPin size={16} />
                {resource.location || "Location not specified"}
              </span>
              {resource.capacity && (
                <span className="flex items-center gap-2">
                  <Users size={16} />
                  Up to {resource.capacity} people
                </span>
              )}
            </div>
            <p className="mt-7 whitespace-pre-wrap text-sm leading-7 text-stone-600">
              {resource.description ||
                "No additional information has been added for this resource."}
            </p>
            <div className="mt-8 flex flex-wrap items-start gap-3 border-t border-stone-100 pt-6">
              {resource.isActive && (
                <Button asChild>
                  <Link href={`/reservations/new?resourceId=${id}`}>
                    <Plus size={16} />
                    Reserve this resource
                  </Link>
                </Button>
              )}
              {user.role === "ADMIN" && (
                <>
                  <Button asChild variant="outline">
                    <Link href={`/resources/${id}/edit`}>
                      <Pencil size={15} />
                      Edit details
                    </Link>
                  </Button>
                  <ConfirmAction kind="resource" id={id} active={resource.isActive} />
                </>
              )}
            </div>
            {!resource.isActive && (
              <p className="mt-5 rounded-lg bg-amber-50 p-4 text-xs leading-5 text-amber-800">
                New reservations are unavailable. Existing reservations remain confirmed and can be
                managed separately.
              </p>
            )}
          </div>
        </section>
        <aside className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <CalendarDays size={17} className="text-emerald-700" />
            Upcoming occupied times
          </h2>
          <p className="mt-2 text-xs leading-5 text-stone-500">
            Next {LIMITS.scheduleDays} days · {TIME_ZONE_LABEL}. Other team members’ reservation
            details stay private.
          </p>
          <div className="mt-5 divide-y divide-stone-100">
            {schedule.length ? (
              schedule.map((slot, index) => (
                <div key={index} className="py-4">
                  <p className="text-xs font-medium text-stone-700">{formatDate(slot.startAt)}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {formatTime(slot.startAt)} –{" "}
                    {formatDate(slot.startAt, DATE_FORMATS.dateInput) !==
                    formatDate(slot.endAt, DATE_FORMATS.dateInput)
                      ? `${formatDate(slot.endAt)} `
                      : ""}
                    {formatTime(slot.endAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-5 text-xs leading-5 text-stone-500">
                No occupied times in the next 7 days. Check your chosen time when reserving.
              </p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
