"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./dialog";
import { Button } from "./button";
import {
  cancelReservationAction,
  resourceStatusAction,
  memberStatusAction,
  archiveMemberAction,
} from "@/app/actions";

export function ConfirmAction({
  id,
  kind,
  active,
}: {
  id: string;
  kind: "resource" | "reservation" | "member" | "member-archive";
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const title =
    kind === "member-archive"
      ? "Archive member"
      : kind === "member"
        ? active
          ? "Deactivate member"
          : "Activate member"
        : kind === "reservation"
          ? "Cancel reservation"
          : active
            ? "Deactivate resource"
            : "Activate resource";
  async function confirm() {
    setPending(true);
    setMessage("");
    try {
      const result =
        kind === "member-archive"
          ? await archiveMemberAction(id)
          : kind === "member"
            ? await memberStatusAction(id, !active)
            : kind === "reservation"
              ? await cancelReservationAction(id)
              : await resourceStatusAction(id, !active);
      setMessage(result.message);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      }
    } catch {
      setMessage("Could not connect. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!pending) setOpen(value);
        }}
      >
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={
              kind === "reservation" || kind === "member-archive" || active
                ? "text-red-700 hover:bg-red-50"
                : ""
            }
          >
            {title}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle className="pr-7 text-lg font-semibold">{title}?</DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-6 text-stone-500">
            {kind === "member-archive" || (kind === "member" && active)
              ? "This account will lose access and existing sessions will be revoked. Its reservations and history are retained. You can reactivate the account later."
              : kind === "member"
                ? "This member will be able to sign in and reserve resources again."
                : kind === "reservation"
                  ? "This will free the time slot for your team. The reservation will remain in your history."
                  : active
                    ? "New reservations will be blocked. Existing reservations remain confirmed and can be managed separately."
                    : "Your team will be able to reserve this resource again."}
          </DialogDescription>
          {message && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {message}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <DialogClose asChild>
              <Button variant="outline" disabled={pending}>
                Keep as is
              </Button>
            </DialogClose>
            <Button
              variant={
                kind === "reservation" || kind === "member-archive" || active
                  ? "destructive"
                  : "default"
              }
              onClick={confirm}
              disabled={pending}
            >
              {pending && <Loader2 size={15} className="animate-spin" />}
              {title}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {message && !open && (
        <p role="status" className="mt-3 max-w-xs text-xs text-emerald-800">
          {message}
        </p>
      )}
    </div>
  );
}
