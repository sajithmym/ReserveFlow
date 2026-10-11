import Link from "next/link";
import { ArrowUpRight, MapPin, Users } from "lucide-react";
import { ResourceVisual } from "./resource-visual";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";

export function ResourceCard({
  resource,
}: {
  resource: {
    id: string;
    name: string;
    category: string;
    location: string | null;
    capacity: number | null;
    description: string | null;
    isActive: boolean;
    isAvailable: boolean;
  };
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-stone-200/80 bg-white transition-shadow hover:shadow-md hover:shadow-stone-200/40">
      <Link href={`/resources/${resource.id}`} tabIndex={-1} aria-label={`View ${resource.name}`}>
        <ResourceVisual category={resource.category} />
      </Link>
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold tracking-wider text-stone-400 uppercase">
            {resource.category}
          </span>
          <StatusBadge
            label={
              !resource.isActive
                ? "Inactive"
                : resource.isAvailable
                  ? "Available now"
                  : "In use now"
            }
            tone={!resource.isActive ? "neutral" : resource.isAvailable ? "green" : "amber"}
          />
        </div>
        <h2 className="font-semibold text-stone-900">
          <Link href={`/resources/${resource.id}`} className="hover:text-emerald-700">
            {resource.name}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-stone-500">
          {resource.description || "A shared resource for your team."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-stone-500">
          <span className="flex items-center gap-1.5">
            <MapPin size={13} />
            {resource.location || "Location not specified"}
          </span>
          {resource.capacity && (
            <span className="flex items-center gap-1.5">
              <Users size={13} />
              {resource.capacity} people
            </span>
          )}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
          <Link
            href={`/resources/${resource.id}`}
            className="text-xs font-semibold text-stone-600 hover:text-emerald-700"
          >
            View details
          </Link>
          {resource.isActive && (
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs text-emerald-700">
              <Link href={`/reservations/new?resourceId=${resource.id}`}>
                Reserve <ArrowUpRight size={14} />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
