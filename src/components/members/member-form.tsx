"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { saveMemberAction } from "@/app/actions";
import { useHydrated } from "@/hooks/use-hydrated";
import { LIMITS, ROLE_OPTIONS, ACTIVE_STATUS_OPTIONS } from "@/config/settings";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { ActionResult } from "@/lib/errors";

type Member = { id: string; name: string; email: string; role: string; isActive: boolean };
export function MemberForm({ member }: { member?: Member }) {
  const router = useRouter(),
    hydrated = useHydrated();
  const password = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false),
    [result, setResult] = useState<ActionResult | null>(null);
  const fields = result && !result.ok ? result.fields : undefined;
  return (
    <form
      className="max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6 md:p-8"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        setResult(null);
        try {
          const response = await saveMemberAction(member?.id ?? null, {
            name: form.get("name"),
            email: form.get("email"),
            role: form.get("role"),
            isActive: form.get("isActive") === "active",
            password: form.get("password"),
          });
          setResult(response);
          if (response.ok) {
            router.push(`/members/${response.id}`);
            router.refresh();
          }
        } catch {
          setResult({
            ok: false,
            code: "INTERNAL_ERROR",
            message: "Could not connect. Please try again.",
          });
        } finally {
          if (password.current) password.current.value = "";
          setPending(false);
        }
      }}
    >
      <fieldset disabled={!hydrated || pending} className="space-y-6">
        <Field name="name" label="Full name" error={fields?.name}>
          <input
            id="name"
            name="name"
            required
            minLength={LIMITS.nameMin}
            maxLength={LIMITS.name}
            defaultValue={member?.name}
            className={inputClass}
            aria-invalid={!!fields?.name}
            aria-describedby={fields?.name ? "name-error" : undefined}
          />
        </Field>
        <Field name="email" label="Email address" error={fields?.email}>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={LIMITS.email}
            defaultValue={member?.email}
            className={inputClass}
            autoComplete="off"
            aria-invalid={!!fields?.email}
            aria-describedby={fields?.email ? "email-error" : undefined}
          />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field name="role" label="Role" error={fields?.role}>
            <SearchableSelect
              id="role"
              name="role"
              required
              clearable={false}
              defaultValue={member?.role ?? "MEMBER"}
              options={ROLE_OPTIONS}
              aria-invalid={!!fields?.role}
              aria-describedby={fields?.role ? "role-error" : undefined}
            />
          </Field>
          <Field name="isActive" label="Account status" error={fields?.isActive}>
            <SearchableSelect
              id="isActive"
              name="isActive"
              aria-label="Account status"
              required
              clearable={false}
              defaultValue={member?.isActive === false ? "inactive" : "active"}
              options={ACTIVE_STATUS_OPTIONS}
            />
          </Field>
        </div>
        <Field
          name="password"
          label={member ? "New password (optional)" : "Initial password"}
          error={fields?.password}
          hint={
            member
              ? "Leave blank to keep the current password. Changing access, email, or password signs this member out."
              : `Use at least ${LIMITS.passwordMin} characters. Share the initial password privately with the member.`
          }
        >
          <input
            ref={password}
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required={!member}
            minLength={LIMITS.passwordMin}
            maxLength={LIMITS.passwordMax}
            className={inputClass}
            aria-invalid={!!fields?.password}
            aria-describedby={fields?.password ? "password-error" : undefined}
          />
        </Field>
        {result && (
          <p
            role={result.ok ? "status" : "alert"}
            className={`rounded-lg p-3 text-sm ${result.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
          >
            {result.message}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t border-stone-100 pt-5">
          <Button asChild variant="outline">
            <Link href={member ? `/members/${member.id}` : "/members"}>Cancel</Link>
          </Button>
          <Button disabled={pending}>
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {member ? "Save changes" : "Create member"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
