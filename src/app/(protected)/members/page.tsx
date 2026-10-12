import Link from "next/link";
import { Eye, Pencil, Plus, Search } from "lucide-react";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { requirePageAdmin } from "@/lib/auth/guards";
import { listMembers } from "@/lib/services/members";
import { parseFilters } from "@/lib/validators";
import { LIMITS, ROLE_OPTIONS, ACTIVE_STATUS_OPTIONS } from "@/config/settings";
import { PageHeading } from "@/components/ui/page-heading";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterError } from "@/components/ui/filter-error";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Members" };
export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePageAdmin();
  let filters;
  try {
    filters = parseFilters(await searchParams);
  } catch {
    return <FilterError path="/members" />;
  }
  const { members, total } = await listMembers(filters);
  return (
    <>
      <PageHeading
        eyebrow="The people behind your plans"
        title="Members"
        description="Manage workspace accounts, roles, and access."
        action={
          <Button asChild>
            <Link href="/members/new">
              <Plus size={16} />
              Add member
            </Link>
          </Button>
        }
      />
      <form
        action="/members"
        className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-4"
      >
        <div className="relative min-w-48 flex-1">
          <Search size={16} className="absolute top-3.5 left-3 text-stone-400" />
          <label htmlFor="q" className="sr-only">
            Search members
          </label>
          <input
            key={`q:${filters.q}`}
            id="q"
            name="q"
            maxLength={LIMITS.search}
            defaultValue={filters.q}
            placeholder="Search by name or email…"
            className={`${inputClass} pl-10`}
          />
        </div>
        <label htmlFor="role" className="sr-only">
          Filter by role
        </label>
        <SearchableSelect
          key={`role:${filters.role}`}
          id="role"
          name="role"
          defaultValue={filters.role}
          options={ROLE_OPTIONS}
          placeholder="All roles"
          className="w-full sm:w-44"
        />
        <label htmlFor="active" className="sr-only">
          Filter by account status
        </label>
        <SearchableSelect
          key={`active:${filters.active}`}
          id="active"
          name="active"
          defaultValue={filters.active}
          options={ACTIVE_STATUS_OPTIONS}
          placeholder="All statuses"
          className="w-full sm:w-44"
        />
        <Button variant="outline">Apply</Button>
        {(filters.q || filters.role || filters.active) && (
          <Link href="/members" className="px-2 text-xs text-stone-500">
            Clear
          </Link>
        )}
      </form>
      {members.length ? (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Workspace members</caption>
            <thead className="border-b border-stone-100 bg-stone-50 text-xs text-stone-500">
              <tr>
                {["Member", "Role", "Status", "Reservations", "Actions"].map((heading) => (
                  <th scope="col" key={heading} className="px-5 py-4 font-medium">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-5 py-4">
                    <Link
                      href={`/members/${member.id}`}
                      className="font-semibold text-stone-800 hover:text-emerald-700"
                    >
                      {member.name}
                    </Link>
                    <p className="mt-1 text-xs text-stone-500">{member.email}</p>
                  </td>
                  <td className="px-5 py-4 text-xs">
                    {ROLE_OPTIONS.find((role) => role.value === member.role)?.label}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${member.isActive ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}
                    >
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/reservations?memberId=${member.id}`}
                      className="text-xs text-emerald-700"
                    >
                      {member._count.reservations}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="icon">
                        <Link
                          href={`/members/${member.id}`}
                          aria-label={`View ${member.name}`}
                          title={`View ${member.name}`}
                        >
                          <Eye size={17} aria-hidden="true" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon">
                        <Link
                          href={`/members/${member.id}/edit`}
                          aria-label={`Edit ${member.name}`}
                          title={`Edit ${member.name}`}
                        >
                          <Pencil size={17} aria-hidden="true" />
                        </Link>
                      </Button>
                      <ConfirmAction
                        id={member.id}
                        kind="member-archive"
                        iconOnly
                        memberName={member.name}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No members found"
          description="Try another search, role, or account status."
        />
      )}
      <Pagination total={total} filters={filters} path="/members" />
    </>
  );
}
