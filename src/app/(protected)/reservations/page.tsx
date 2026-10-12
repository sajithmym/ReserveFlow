import Link from "next/link";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { requirePageUser } from "@/lib/auth/guards";
import { listReservations } from "@/lib/services/reservations";
import { reservationResourceOptions } from "@/lib/services/resources";
import { parseFilters } from "@/lib/validators";
import { PageHeading } from "@/components/ui/page-heading";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { ReservationTable } from "@/components/reservations/reservation-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { FilterError } from "@/components/ui/filter-error";
import type { Metadata } from "next";

import { SearchableSelect } from "@/components/ui/searchable-select";
import { DatePicker } from "@/components/ui/date-picker";
import { memberOptions } from "@/lib/services/members";
import { LIMITS, RESERVATION_STATUS_OPTIONS, TIME_ZONE_LABEL } from "@/config/settings";

export const metadata: Metadata = { title: "Reservations" };
export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePageUser();
  let filters;
  try {
    filters = parseFilters(await searchParams);
  } catch {
    return <FilterError path="/reservations" />;
  }
  const [{ reservations, total }, resources, members] = await Promise.all([
    listReservations(filters),
    reservationResourceOptions(),
    user.role === "ADMIN" ? memberOptions() : Promise.resolve([]),
  ]);
  return (
    <>
      <PageHeading
        eyebrow="Keep your plans in one place"
        title={user.role === "ADMIN" ? "Reservations" : "My reservations"}
        description={
          user.role === "ADMIN"
            ? "See and manage reservations across your workspace."
            : "Everything you’ve booked, from upcoming plans to past sessions."
        }
        action={
          <Button asChild>
            <Link href="/reservations/new">
              <Plus size={16} />
              New reservation
            </Link>
          </Button>
        }
      />
      <form
        action="/reservations"
        className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-stone-200/80 bg-white p-4"
      >
        <div className="relative min-w-40 flex-1">
          <Search size={16} className="absolute top-3.5 left-3 text-stone-400" />
          <label htmlFor="q" className="sr-only">
            Search reservations
          </label>
          <input
            key={`q:${filters.q}`}
            id="q"
            name="q"
            maxLength={LIMITS.search}
            defaultValue={filters.q}
            placeholder="Search reservations…"
            className={`${inputClass} pl-10`}
          />
        </div>
        <label htmlFor="resourceId" className="sr-only">
          Resource
        </label>
        <SearchableSelect
          key={`resourceId:${filters.resourceId}`}
          id="resourceId"
          name="resourceId"
          defaultValue={filters.resourceId}
          options={resources.map((r) => ({ value: r.id, label: r.name }))}
          placeholder="All resources"
          className="w-full sm:w-44"
        />
        <label htmlFor="status" className="sr-only">
          Reservation status
        </label>
        <SearchableSelect
          key={`status:${filters.status}`}
          id="status"
          name="status"
          defaultValue={filters.status}
          options={RESERVATION_STATUS_OPTIONS}
          placeholder="All statuses"
          className="w-full sm:w-40"
        />
        {user.role === "ADMIN" && (
          <>
            <label htmlFor="memberId" className="sr-only">
              Filter by member
            </label>
            <SearchableSelect
              key={`memberId:${filters.memberId}`}
              id="memberId"
              name="memberId"
              defaultValue={filters.memberId}
              options={members.map((m) => ({
                value: m.id,
                label: `${m.name}${m.isActive ? "" : " (inactive)"}`,
              }))}
              placeholder="All members"
              className="w-full sm:w-44"
            />
          </>
        )}
        <label htmlFor="date" className="sr-only">
          Date in Sri Lanka time
        </label>
        <DatePicker
          key={`date:${filters.date}`}
          id="date"
          name="date"
          aria-label="Date in Sri Lanka time"
          defaultValue={filters.date}
          className="w-full sm:w-44"
        />
        <Button variant="outline">
          <SlidersHorizontal size={15} />
          Apply
        </Button>
        {(filters.q ||
          filters.status ||
          filters.date ||
          filters.resourceId ||
          filters.memberId) && (
          <Link href="/reservations" className="px-2 text-xs text-stone-500">
            Clear
          </Link>
        )}
      </form>
      <div className="mb-4 flex flex-wrap justify-between gap-2 text-xs text-stone-500">
        <span>
          {total} reservation{total === 1 ? "" : "s"}
        </span>
        <span className="text-[11px] text-stone-400">{TIME_ZONE_LABEL}</span>
      </div>
      {reservations.length ? (
        <ReservationTable reservations={reservations} admin={user.role === "ADMIN"} />
      ) : (
        <EmptyState
          title="No reservations here yet"
          description="Try adjusting your filters, or reserve a resource for your next plan."
          action={
            <Button asChild>
              <Link href="/reservations/new">Create a reservation</Link>
            </Button>
          }
        />
      )}
      <Pagination total={total} filters={filters} path="/reservations" />
    </>
  );
}
