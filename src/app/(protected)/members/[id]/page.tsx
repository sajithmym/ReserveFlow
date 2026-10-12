import Link from "next/link";
import { Pencil, CalendarDays } from "lucide-react";
import { requirePageAdmin } from "@/lib/auth/guards";
import { getMember } from "@/lib/services/members";
import { pageRecord } from "@/lib/services/page-record";
import { formatDate } from "@/lib/time";
import { ROLE_OPTIONS } from "@/config/settings";
import { PageHeading } from "@/components/ui/page-heading";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageAdmin();
  const { id } = await params;
  const member = await pageRecord(() => getMember(id));
  return (
    <>
      <PageHeading
        eyebrow="Workspace member"
        title={member.name}
        description={member.email}
        action={
          <Button asChild variant="outline">
            <Link href={`/members/${id}/edit`}>
              <Pencil size={15} />
              Edit details
            </Link>
          </Button>
        }
      />
      <section className="max-w-3xl rounded-xl border border-stone-200 bg-white p-6 md:p-8">
        <dl className="grid gap-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-stone-500">Role</dt>
            <dd className="mt-2 text-sm font-semibold">
              {ROLE_OPTIONS.find((role) => role.value === member.role)?.label}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">Account status</dt>
            <dd className="mt-2 text-sm font-semibold">
              {member.isActive ? "Active" : "Inactive"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">Joined</dt>
            <dd className="mt-2 text-sm font-semibold">{formatDate(member.createdAt)}</dd>
          </div>
        </dl>
        <div className="mt-6 border-t border-stone-100 pt-6">
          <Button asChild variant="outline">
            <Link href={`/reservations?memberId=${id}`}>
              <CalendarDays size={15} />
              View reservations ({member._count.reservations})
            </Link>
          </Button>
          <p className="mt-3 text-xs leading-5 text-stone-500">
            Members reserve resources from their own signed-in accounts. Deactivating or archiving
            an account revokes access and retains all reservations.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <ConfirmAction id={id} kind="member" active={member.isActive} />
          <ConfirmAction id={id} kind="member-archive" />
        </div>
      </section>
    </>
  );
}
