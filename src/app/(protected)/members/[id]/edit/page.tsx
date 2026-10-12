import { requirePageAdmin } from "@/lib/auth/guards";
import { getMember } from "@/lib/services/members";
import { pageRecord } from "@/lib/services/page-record";
import { PageHeading } from "@/components/ui/page-heading";
import { MemberForm } from "@/components/members/member-form";
export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageAdmin();
  const { id } = await params;
  const member = await pageRecord(() => getMember(id));
  return (
    <>
      <PageHeading
        title="Edit member"
        description="Update details and access. Existing reservations keep their owner."
      />
      <MemberForm member={member} />
    </>
  );
}
