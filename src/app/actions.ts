"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/guards";
import { publicError, type ActionResult } from "@/lib/errors";
import * as resources from "@/lib/services/resources";
import * as reservations from "@/lib/services/reservations";
import * as members from "@/lib/services/members";
import { CONFLICT_MESSAGE } from "@/config/settings";

function refresh() {
  ["/", "/resources", "/reservations", "/members"].forEach((path) =>
    revalidatePath(path, "layout"),
  );
}
async function mutate(
  operation: () => Promise<{ id: string }>,
  message: string,
): Promise<ActionResult> {
  try {
    await requireUser();
    const result = await operation();
    refresh();
    return { ok: true, id: result.id, message };
  } catch (error) {
    return publicError(error);
  }
}
export async function saveResourceAction(id: string | null, input: unknown) {
  return mutate(
    () => (id ? resources.updateResource(id, input) : resources.createResource(input)),
    id ? "Resource updated." : "Resource created.",
  );
}
export async function resourceStatusAction(id: string, active: boolean) {
  return mutate(
    () => resources.setResourceActive(id, active),
    active ? "Resource activated." : "Resource deactivated. Existing reservations are retained.",
  );
}
export async function saveReservationAction(id: string | null, input: unknown) {
  return mutate(
    () => (id ? reservations.updateReservation(id, input) : reservations.createReservation(input)),
    id ? "Reservation updated." : "Reservation confirmed.",
  );
}
export async function cancelReservationAction(id: string) {
  return mutate(
    () => reservations.cancelReservation(id),
    "Reservation cancelled. The time slot is available again.",
  );
}
export async function availabilityAction(
  id: string | null,
  input: unknown,
): Promise<ActionResult & { available?: boolean }> {
  try {
    await requireUser();
    const available = id
      ? await reservations.checkEditAvailability(id, input)
      : await reservations.checkAvailability(input);
    return {
      ok: true,
      available,
      message: available
        ? "This time slot is currently available. Availability is checked again when you confirm."
        : CONFLICT_MESSAGE,
    };
  } catch (error) {
    return publicError(error);
  }
}
export async function saveMemberAction(id: string | null, input: unknown) {
  return mutate(
    () => (id ? members.updateMember(id, input) : members.createMember(input)),
    id ? "Member updated." : "Member created.",
  );
}
export async function memberStatusAction(id: string, active: boolean) {
  return mutate(
    () => members.setMemberActive(id, active),
    active ? "Member activated." : "Member deactivated. Reservation history is retained.",
  );
}
export async function archiveMemberAction(id: string) {
  return mutate(
    () => members.archiveMember(id),
    "Member archived. Reservation history is retained.",
  );
}
