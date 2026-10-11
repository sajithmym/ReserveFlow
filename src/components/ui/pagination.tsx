import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { PAGE_SIZE } from "@/lib/config";
import type { Filters } from "@/lib/validators";

export function Pagination({
  total,
  filters,
  path,
}: {
  total: number;
  filters: Filters;
  path: string;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  function href(page: number) {
    const params = new URLSearchParams();
    Object.entries({ ...filters, page }).forEach(([key, value]) => {
      if (value !== "") params.set(key, String(value));
    });
    return `${path}?${params}`;
  }
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
      <span>
        {total
          ? `${(filters.page - 1) * PAGE_SIZE + 1}–${Math.min(filters.page * PAGE_SIZE, total)} of ${total} results`
          : "0 results"}
      </span>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline" aria-disabled={filters.page <= 1}>
          <Link href={href(Math.max(1, filters.page - 1))} aria-label="Previous page">
            <ChevronLeft size={14} />
          </Link>
        </Button>
        <span className="px-2">
          Page {filters.page} of {pages}
        </span>
        <Button asChild size="sm" variant="outline" aria-disabled={filters.page >= pages}>
          <Link href={href(Math.min(pages, filters.page + 1))} aria-label="Next page">
            <ChevronRight size={14} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
