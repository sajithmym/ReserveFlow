"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { useHydrated } from "@/hooks/use-hydrated";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

export function SignOutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error();
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
      setPending(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) {
          setError("");
          setOpen(next);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={iconOnly ? "ghost" : "outline"}
          size={iconOnly ? "icon" : "default"}
          className={iconOnly ? undefined : "mt-6 w-full"}
          aria-label="Sign out"
          title="Sign out"
          disabled={!hydrated || pending}
        >
          <LogOut size={17} aria-hidden="true" />
          {!iconOnly && "Sign out"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="pr-7 text-lg font-semibold">Sign out?</DialogTitle>
        <DialogDescription className="mt-3 text-sm leading-6 text-stone-500">
          You will need to sign in again to access your workspace.
        </DialogDescription>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={signOut} disabled={pending}>
            {pending ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            {pending ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
