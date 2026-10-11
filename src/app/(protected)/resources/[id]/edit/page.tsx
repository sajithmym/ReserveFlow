import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/guards";
import { getResource } from "@/lib/services/resources";
import { pageRecord } from "@/lib/services/page-record";
import { PageHeading } from "@/components/ui/page-heading";
import { ResourceForm } from "@/components/resources/resource-form";
export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  if ((await requirePageUser()).role !== "ADMIN") notFound();
  const { id } = await params;
  const resource = await pageRecord(() => getResource(id));
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading
        title="Edit resource"
        description="Keep resource information useful and up to date."
      />
      <ResourceForm resource={resource} />
    </div>
  );
}
