import { redirect } from "next/navigation";
import { CalendarCheck2, Check, Layers3, ShieldCheck } from "lucide-react";
import { currentUser } from "@/lib/auth/guards";
import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };
export default async function LoginPage() {
  if (await currentUser()) redirect("/");
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-[#e9f2ed] p-12 lg:flex lg:flex-col xl:p-16">
        <div className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-emerald-900">
          <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-800 text-white">
            <Layers3 size={21} />
          </span>
          ReserveFlow
        </div>
        <div className="my-auto max-w-lg py-14">
          <p className="mb-5 text-xs font-semibold tracking-[0.2em] text-emerald-700 uppercase">
            Your workspace, in sync
          </p>
          <h1 className="text-5xl leading-[1.15] font-semibold tracking-[-0.04em] text-emerald-950 xl:text-6xl">
            Shared spaces.
            <br />
            Better days.
          </h1>
          <p className="mt-6 max-w-sm text-base leading-7 text-emerald-900/60">
            A little clarity goes a long way. Bring your team’s resources and reservations together
            in one calm place.
          </p>
          <div className="relative mt-10 rounded-2xl border border-white/90 bg-white/70 p-6 shadow-xl shadow-emerald-900/5">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <CalendarCheck2 size={23} />
              </span>
              <div>
                <p className="text-sm font-semibold text-emerald-950">Make time for good work.</p>
                <p className="mt-1 text-xs text-stone-500">A simple way to keep plans moving.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["Find a resource", "Choose your time", "You’re all set"].map((label, i) => (
                <div key={label} className="rounded-lg bg-white p-3">
                  <span className="mb-3 flex size-6 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700">
                    {i === 2 ? <Check size={13} /> : `0${i + 1}`}
                  </span>
                  <p className="text-[11px] font-medium text-stone-600">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="flex items-center gap-2 text-xs text-emerald-800/70">
          <ShieldCheck size={15} />
          Clear access. Reliable reservations. Less guesswork.
        </p>
        <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full border border-emerald-900/5" />
      </section>
      <section className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-12 flex items-center gap-2 text-xl font-bold text-emerald-800 lg:hidden">
            <Layers3 />
            ReserveFlow
          </div>
          <span className="mb-6 inline-flex size-12 items-center justify-center rounded-xl border border-stone-200 text-emerald-700">
            <CalendarCheck2 size={26} strokeWidth={1.6} />
          </span>
          <h2 className="text-3xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-3 text-sm text-stone-500">
            Sign in to your workspace. Your next plan starts here.
          </p>
          <LoginForm />
          <p className="mt-12 text-center text-[11px] text-stone-400">
            ReserveFlow · Resource Reservation Management
          </p>
        </div>
      </section>
    </main>
  );
}
