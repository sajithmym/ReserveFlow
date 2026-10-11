import { PageHeading } from "@/components/ui/page-heading";
import { ReservationForm } from "@/components/reservations/reservation-form";
import { resourceOptions } from "@/lib/services/resources";
import { nextReservationStart } from "@/lib/time";
import { idSchema } from "@/lib/validators";
import { FilterError } from "@/components/ui/filter-error";
import { EmptyState } from "@/components/ui/empty-state";

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const parsed =
    params.resourceId === undefined ? undefined : idSchema.safeParse(params.resourceId);
  if (parsed && !parsed.success) return <FilterError path="/reservations/new" />;
  const resources = await resourceOptions();
  const selected = parsed?.success ? parsed.data : undefined;
  if (selected && !resources.some((r) => r.id === selected))
    return (
      <EmptyState
        title="This resource can’t be reserved"
        description="It may be inactive or unavailable. Choose an active resource from the directory."
      />
    );
  return (
    <>
      <PageHeading
        eyebrow="Make your next plan"
        title="New reservation"
        description="A few details, and the time is yours."
      />
      {resources.length ? (
        <ReservationForm
          resources={resources}
          selectedResource={selected}
          initialStart={nextReservationStart()}
        />
      ) : (
        <EmptyState
          title="No active resources yet"
          description="An administrator needs to add or activate a resource before you can reserve it."
        />
      )}
    </>
  );
}
