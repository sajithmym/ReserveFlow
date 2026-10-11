import Link from "next/link";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { requirePageUser } from "@/lib/auth/guards";
import { listResources } from "@/lib/services/resources";
import { parseFilters } from "@/lib/validators";
import { CATEGORIES } from "@/lib/config";
import { ResourceCard } from "@/components/resources/resource-card";
import { PageHeading } from "@/components/ui/page-heading";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { FilterError } from "@/components/ui/filter-error";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Resources" };
export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePageUser();
  let filters;
  try {
    filters = parseFilters(await searchParams);
  } catch {
    return <FilterError path="/resources" />;
  }
  const { resources, total, activeTotal } = await listResources(filters);
  return (
    <>
      <PageHeading
        eyebrow="A space for every plan"
        title="Resources"
        description="Find the right space or equipment for your next reservation."
        action={
          user.role === "ADMIN" ? (
            <Button asChild>
              <Link href="/resources/new">
                <Plus size={16} />
                Add resource
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/reservations/new">
                <Plus size={16} />
                New reservation
              </Link>
            </Button>
          )
        }
      />
      <form
        action="/resources"
        className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-stone-200/80 bg-white p-4"
      >
        <div className="relative min-w-48 flex-1">
          <Search size={16} className="absolute top-3.5 left-3 text-stone-400" />
          <label htmlFor="q" className="sr-only">
            Search resources
          </label>
          <input
            id="q"
            name="q"
            maxLength={100}
            defaultValue={filters.q}
            placeholder="Search by name or location…"
            className={`${inputClass} pl-10`}
          />
        </div>
        <label htmlFor="category" className="sr-only">
          Filter by category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={filters.category}
          className={`${inputClass} w-full sm:w-48`}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <Button variant="outline">
          <SlidersHorizontal size={15} />
          Apply
        </Button>
        {(filters.q || filters.category) && (
          <Link href="/resources" className="px-2 text-xs text-stone-500 hover:text-emerald-700">
            Clear
          </Link>
        )}
      </form>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-stone-500">
          <span className="font-semibold text-stone-700">{total}</span> resource
          {total === 1 ? "" : "s"} {filters.q || filters.category ? "found" : "in your workspace"}
        </p>
        <span className="flex items-center gap-1.5 text-[11px] text-stone-400">
          <span className="size-1.5 rounded-full bg-emerald-600" />
          {activeTotal} active · Availability shown for now
        </span>
      </div>
      {resources.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No resources found"
          description="Try another search or category. Administrators can add new resources to the workspace."
          action={
            <Button asChild variant="outline">
              <Link href="/resources">Clear filters</Link>
            </Button>
          }
        />
      )}
      <Pagination total={total} filters={filters} path="/resources" />
    </>
  );
}
