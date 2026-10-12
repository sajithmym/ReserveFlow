import { requirePageAdmin } from "@/lib/auth/guards";
import { PageHeading } from "@/components/ui/page-heading";
import { MemberForm } from "@/components/members/member-form";
export default async function NewMemberPage() {
  await requirePageAdmin();
  return (
    <>
      <PageHeading
        title="Add member"
        description="Create an account with the access your teammate needs."
      />
      <MemberForm />
    </>
  );
}
