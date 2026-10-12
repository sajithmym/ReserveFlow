import { requirePageUser } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import { getReservation } from "@/lib/services/reservations";
import { pageRecord } from "@/lib/services/page-record";
import { PageHeading } from "@/components/ui/page-heading";
import { ReservationForm } from "@/components/reservations/reservation-form";
import { toLocalInput } from "@/lib/time";
export default async function EditReservationPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser();
  const { id } = await params;
  const booking = await pageRecord(() => getReservation(id));
  if (booking.status !== "CONFIRMED" || booking.startAt <= new Date() || !booking.resource.isActive)
    notFound();
  return (
    <>
      <PageHeading
        title="Reschedule reservation"
        description="Change your plans while keeping the same resource. Availability will be checked again."
      />
      <ReservationForm
        resources={[booking.resource]}
        booking={{
          id,
          resourceId: booking.resourceId,
          title: booking.title,
          startAt: booking.startAt.toISOString(),
          endAt: booking.endAt.toISOString(),
        }}
        initialStart={toLocalInput(booking.startAt)}
      />
    </>
  );
}
