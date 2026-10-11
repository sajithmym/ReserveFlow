import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Grid2X2,
  Plus,
  Sparkles,
} from "lucide-react";
import { getDashboard } from "@/lib/services/dashboard";
import { formatDate, formatTime } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import { ReservationTable } from "@/components/reservations/reservation-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ResourceVisual } from "@/components/resources/resource-visual";

export default async function DashboardPage() {
  const data = await getDashboard();
  const admin = data.user.role === "ADMIN";
  const metrics = [
    {
      label: "Active resources",
      value: data.activeResources,
      detail: `${data.availableNow} available right now`,
      icon: Grid2X2,
      style: "bg-emerald-50 text-emerald-700",
    },
    {
      label: admin ? "Reservations today" : "Your reservations today",
      value: data.todayBookings,
      detail: "Confirmed, including ongoing",
      icon: CalendarDays,
      style: "bg-blue-50 text-blue-700",
    },
    {
      label: admin ? "Upcoming reservations" : "Your upcoming plans",
      value: data.upcomingCount,
      detail: "Confirmed future reservations",
      icon: Clock3,
      style: "bg-amber-50 text-amber-700",
    },
    {
      label: admin ? "Cancelled reservations" : "Your cancellations",
      value: data.cancelledCount,
      detail: "Kept safely in booking history",
      icon: ArrowDownRight,
      style: "bg-stone-100 text-stone-600",
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="A clear view of your day"
        title={`Hello, ${data.user.name.split(" ")[0]}.`}
        description={
          admin
            ? "Here’s what’s happening across your workspace."
            : "Your resources, your reservations, and a little more peace of mind."
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
      <section className="relative mb-7 flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-xl border border-emerald-100 bg-[#eaf3ee] p-6 md:p-7">
        <div className="relative z-10">
          <span className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold tracking-wider text-emerald-700 uppercase">
            <Sparkles size={14} />
            Space for your next big idea
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-emerald-950">
            Good work starts with a little planning.
          </h2>
          <p className="mt-2 text-xs leading-5 text-emerald-900/60">
            Find the right resource, pick your time, and make it happen.
          </p>
          <Link
            href="/resources"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-800"
          >
            Explore resources <ArrowRight size={14} />
          </Link>
        </div>
        <div className="relative z-10 flex items-center gap-4 rounded-xl border border-white/80 bg-white/60 px-5 py-4">
          <div className="rounded-lg bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-semibold text-emerald-700 uppercase">
              {formatDate(data.now, "MMM")}
            </p>
            <p className="text-2xl font-semibold text-emerald-900">{formatDate(data.now, "dd")}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-950">{formatDate(data.now, "EEEE")}</p>
            <p className="mt-1 text-[11px] text-stone-500">{formatDate(data.now, "d MMMM yyyy")}</p>
            <p className="mt-1 text-[10px] text-stone-400">Sri Lanka time</p>
          </div>
        </div>
        <div className="hero-orbit" />
        <div className="hero-orbit second" />
      </section>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-stone-200/80 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-stone-500">{m.label}</p>
              <span className={`flex size-8 items-center justify-center rounded-lg ${m.style}`}>
                <m.icon size={17} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-800">
              {m.value.toString().padStart(2, "0")}
            </p>
            <p className="mt-2 text-[10px] text-stone-500">{m.detail}</p>
          </div>
        ))}
      </div>
      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-stone-800">Coming up next</h2>
              <p className="mt-1 text-xs text-stone-500">
                {admin
                  ? "The next reservations in your workspace."
                  : "Your next reservations, all in one place."}
              </p>
            </div>
            <Link
              href="/reservations"
              className="flex items-center gap-1 text-xs font-semibold text-emerald-700"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {data.upcoming.length ? (
            <ReservationTable reservations={data.upcoming} />
          ) : (
            <EmptyState
              title="Room for something new"
              description="Your upcoming reservations will appear here. Find a resource and start planning."
              action={
                <Button asChild variant="outline">
                  <Link href="/resources">Find a resource</Link>
                </Button>
              }
            />
          )}
          <div className="mt-4 flex items-center gap-2 text-[11px] text-stone-400">
            <Clock3 size={13} />
            {formatTime(data.now)} · All times in Asia/Colombo (UTC+05:30)
          </div>
        </section>
        <aside>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-stone-800">Your shared workspace</h2>
            <p className="mt-1 text-xs text-stone-500">A place for every kind of work.</p>
          </div>
          <div className="space-y-4 rounded-xl border border-stone-200/80 bg-white p-5">
            {data.categories.length ? (
              data.categories.map((c) => (
                <Link
                  href={`/resources?category=${encodeURIComponent(c.category)}`}
                  key={c.category}
                  className="flex items-center gap-3"
                >
                  <ResourceVisual category={c.category} compact />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-stone-700">{c.category}</p>
                    <p className="mt-1 text-[10px] text-stone-400">
                      {c._count} active resource{c._count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-stone-300" />
                </Link>
              ))
            ) : (
              <p className="text-xs text-stone-500">No active resources yet.</p>
            )}
            <Link
              href="/resources"
              className="block border-t border-stone-100 pt-4 text-center text-xs font-semibold text-emerald-700"
            >
              Browse all resources
            </Link>
          </div>
          <div className="mt-4 flex gap-3 rounded-xl border border-stone-200/70 bg-stone-100/50 p-4">
            <Check size={16} className="mt-0.5 shrink-0 text-emerald-700" />
            <p className="text-[11px] leading-5 text-stone-500">
              A confirmed reservation means the time is yours. We keep overlaps out of the picture.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
