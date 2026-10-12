"use client";
import { LIMITS } from "@/config/settings";
import { useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";

export function LoginForm() {
  const hydrated = useHydrated();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  async function submit(form: FormData) {
    setPending(true);
    setError("");
    try {
      const { error } = await authClient.signIn.email({
        email: String(form.get("email")).trim().toLowerCase(),
        password: String(form.get("password")),
        rememberMe: false,
      });
      if (error) {
        setError(
          error.status === 429
            ? "Too many attempts. Please wait a minute and try again."
            : "Unable to sign in. Check your email and password.",
        );
        setPending(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not connect. Please try again.");
      setPending(false);
    }
  }
  return (
    <form action={submit} className="mt-8 space-y-5">
      <Field name="email" label="Email address">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={LIMITS.email}
          placeholder="you@company.com"
          className={inputClass}
        />
      </Field>
      <Field name="password" label="Password">
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={LIMITS.passwordMax}
            className={`${inputClass} pr-12`}
            placeholder="Enter your password"
          />
          <button
            type="button"
            className="absolute top-0 right-0 flex size-11 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </Field>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <Button size="lg" className="mt-2 w-full" disabled={pending || !hydrated}>
        {pending ? <Loader2 size={17} className="animate-spin" /> : null}Sign in{" "}
        <ArrowRight size={17} />
      </Button>
      <p className="pt-2 text-center text-xs leading-5 text-stone-500">
        Access is provided by your workspace administrator.
        <br />
        Contact them if you need help with your account.
      </p>
    </form>
  );
}
