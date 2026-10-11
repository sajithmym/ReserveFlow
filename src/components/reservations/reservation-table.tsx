import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatDate, formatTime } from "@/lib/time";
import { StatusBadge } from "@/components/ui/status-badge";
import { ResourceVisual } from "@/components/resources/resource-visual";
import type { ReservationWithResource } from "@/lib/services/reservations";

export function ReservationTable({
  reservations,
  admin = false,
}: {
  reservations: ReservationWithResource[];
  admin?: boolean;
}) {
  const now = new Date();
  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200/80 bg-white">
      <table className="w-full min-w-[700px] text-left text-xs">
        <thead className="border-b border-stone-100 bg-stone-50/60 text-[10px] tracking-wider text-stone-500 uppercase">
          <tr>
            <th className="px-5 py-4 font-medium">Resource & purpose</th>
            <th className="px-4 py-4 font-medium">Date & time</th>
            {admin && <th className="px-4 py-4 font-medium">Reserved by</th>}
            <th className="px-4 py-4 font-medium">Status</th>
            <th className="px-5 py-4">
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {reservations.map((r) => (
            <tr key={r.id} className="hover:bg-stone-50/50">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <ResourceVisual category={r.resource.category} compact />
                  <div>
                    <Link
                      href={`/reservations/${r.id}`}
                      className="font-semibold text-stone-800 hover:text-emerald-700"
                    >
                      {r.resource.name}
                    </Link>
                    <p className="mt-1 max-w-64 truncate text-[11px] text-stone-500">{r.title}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <p className="font-medium text-stone-700">{formatDate(r.startAt)}</p>
                <p className="mt-1 text-[11px] text-stone-500">
                  {formatTime(r.startAt)} –{" "}
                  {formatDate(r.startAt, "yyyy-MM-dd") !== formatDate(r.endAt, "yyyy-MM-dd")
                    ? `${formatDate(r.endAt, "d MMM")} `
                    : ""}
                  {formatTime(r.endAt)}
                </p>
              </td>
              {admin && <td className="px-4 py-4 text-stone-600">{r.user.name}</td>}
              <td className="px-4 py-4">
                <StatusBadge
                  label={
                    r.status === "CANCELLED"
                      ? "Cancelled"
                      : r.endAt <= now
                        ? "Completed"
                        : r.startAt <= now
                          ? "In progress"
                          : "Confirmed"
                  }
                  tone={
                    r.status === "CANCELLED" || r.endAt <= now
                      ? "neutral"
                      : r.startAt <= now
                        ? "amber"
                        : "green"
                  }
                />
              </td>
              <td className="px-5 py-4 text-right">
                <Link
                  href={`/reservations/${r.id}`}
                  aria-label={`View ${r.title}`}
                  className="inline-flex rounded-lg p-2 text-stone-400 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <ArrowUpRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
