import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/guards";
import { PageHeading } from "@/components/ui/page-heading";
import { ResourceForm } from "@/components/resources/resource-form";
export default async function NewResourcePage() {
  if ((await requirePageUser()).role !== "ADMIN") notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading
        eyebrow="Build your shared workspace"
        title="Add a resource"
        description="Give your team one more place to do good work."
      />
      <ResourceForm />
    </div>
  );
}
