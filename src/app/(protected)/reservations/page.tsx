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
  const [{ reservations, total }, resources] = await Promise.all([
    listReservations(filters),
    reservationResourceOptions(),
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
            id="q"
            name="q"
            maxLength={100}
            defaultValue={filters.q}
            placeholder="Search reservations…"
            className={`${inputClass} pl-10`}
          />
        </div>
        <label htmlFor="resourceId" className="sr-only">
          Resource
        </label>
        <select
          id="resourceId"
          name="resourceId"
          defaultValue={filters.resourceId}
          className={`${inputClass} w-full sm:w-44`}
        >
          <option value="">All resources</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <label htmlFor="status" className="sr-only">
          Reservation status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={filters.status}
          className={`${inputClass} w-full sm:w-36`}
        >
          <option value="">All statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <label htmlFor="date" className="sr-only">
          Date in Sri Lanka time
        </label>
        <input
          id="date"
          name="date"
          type="date"
          defaultValue={filters.date}
          className={`${inputClass} w-full sm:w-40`}
        />
        <Button variant="outline">
          <SlidersHorizontal size={15} />
          Apply
        </Button>
        {(filters.q || filters.status || filters.date || filters.resourceId) && (
          <Link href="/reservations" className="px-2 text-xs text-stone-500">
            Clear
          </Link>
        )}
      </form>
      <div className="mb-4 flex flex-wrap justify-between gap-2 text-xs text-stone-500">
        <span>
          {total} reservation{total === 1 ? "" : "s"}
        </span>
        <span className="text-[11px] text-stone-400">Sri Lanka time · UTC+05:30</span>
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
