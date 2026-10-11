"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CircleHelp,
  Clock3,
  Grid2X2,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import type { ReactNode } from "react";

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/resources", label: "Resources", icon: Grid2X2 },
  { href: "/reservations", label: "Reservations", icon: CalendarDays },
];
export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 text-xl font-bold tracking-tight",
        dark ? "text-white" : "text-stone-900",
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
        <Layers3 size={21} strokeWidth={2} />
      </span>
      Reserve<span className="-ml-2.5 font-medium text-emerald-700">Flow</span>
    </Link>
  );
}
export function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const active = nav.find((n) => (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)));
  const navLinks = (mobile = false) => (
    <nav aria-label={mobile ? "Mobile navigation" : "Main navigation"} className="space-y-1.5">
      {nav.map((n) => {
        const selected = active?.href === n.href;
        const link = (
          <Link
            href={n.href}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium",
              selected
                ? "bg-emerald-50 text-emerald-800"
                : "text-stone-500 hover:bg-stone-50 hover:text-stone-800",
            )}
          >
            <n.icon size={19} />
            {n.label}
            {selected && <span className="ml-auto h-5 w-1 rounded-full bg-emerald-700" />}
          </Link>
        );
        return mobile ? (
          <DialogClose asChild key={n.href}>
            {link}
          </DialogClose>
        ) : (
          <div key={n.href}>{link}</div>
        );
      })}
    </nav>
  );
  async function signOut() {
    setSigningOut(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error();
      router.push("/login");
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
      setSigningOut(false);
    }
  }
  return (
    <div className="min-h-screen bg-[#f8f9f7]">
      <a
        href="#main-content"
        className="sr-only z-50 rounded bg-white p-3 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-stone-200/80 bg-white px-5 py-7 lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <p className="mt-10 mb-3 px-3 text-[10px] font-semibold tracking-[0.16em] text-stone-400 uppercase">
          Workspace
        </p>
        {navLinks()}
        <div className="mt-auto">
          <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="mb-2 flex items-center gap-2 text-emerald-800">
              <Clock3 size={16} />
              <span className="text-xs font-semibold">One place. Less back-and-forth.</span>
            </div>
            <p className="text-xs leading-5 text-stone-500">
              Find your space and make time for what matters.
            </p>
            <Link
              href="/help"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"
            >
              How it works <ArrowUpRight size={13} />
            </Link>
          </div>
          <Link
            href="/help"
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-stone-500 hover:bg-stone-50"
          >
            <CircleHelp size={18} />
            Help & guidance
          </Link>
          <div className="mt-4 border-t border-stone-100 pt-5">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600">
                {initials(user.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-800">{user.name}</p>
                <p className="mt-0.5 text-[11px] text-stone-500">
                  {user.role === "ADMIN" ? "Administrator" : "Member"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                disabled={signingOut}
                onClick={signOut}
              >
                <LogOut size={17} />
              </Button>
            </div>
            {error && (
              <p role="alert" className="mt-2 text-xs text-red-700">
                {error}
              </p>
            )}
          </div>
        </div>
      </aside>
      <div className="lg:pl-60">
        <header className="flex min-h-20 items-center justify-between gap-4 border-b border-stone-200/70 bg-white px-5 md:px-9">
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu size={21} />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle className="mb-6 text-lg font-semibold">ReserveFlow</DialogTitle>
                <DialogDescription className="mb-4 text-xs text-stone-500">
                  {user.name} · {user.role === "ADMIN" ? "Administrator" : "Member"}
                </DialogDescription>
                {navLinks(true)}
                <Button
                  variant="outline"
                  className="mt-6 w-full"
                  onClick={signOut}
                  disabled={signingOut}
                >
                  <LogOut size={17} />
                  Sign out
                </Button>
                {error && (
                  <p role="alert" className="mt-3 text-sm text-red-700">
                    {error}
                  </p>
                )}
              </DialogContent>
            </Dialog>
            <p className="text-sm text-stone-400">
              <span className="hidden sm:inline">
                Workspace <span className="mx-2 text-stone-300">/</span>
              </span>
              <span className="font-medium text-stone-700">
                {active?.label ?? "Help & guidance"}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-5">
            <form action="/resources" className="relative hidden md:block">
              <Search
                size={16}
                className="pointer-events-none absolute top-2.5 left-3 text-stone-400"
              />
              <label htmlFor="global-search" className="sr-only">
                Search resources
              </label>
              <input
                id="global-search"
                name="q"
                maxLength={100}
                placeholder="Search resources…"
                className="h-9 w-52 rounded-lg border border-stone-200 bg-stone-50/70 pr-3 pl-9 text-xs outline-none focus:border-emerald-600"
              />
            </form>
            <span className="hidden items-center gap-1.5 text-xs text-stone-500 sm:inline-flex">
              <Clock3 size={14} />
              UTC+05:30
            </span>
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-800">
              {initials(user.name)}
            </span>
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-[1440px] px-5 py-8 md:px-9 md:py-9">
          {children}
        </main>
        <footer className="mx-5 flex flex-wrap justify-between gap-2 border-t border-stone-200/70 py-5 text-[11px] text-stone-400 md:mx-9">
          <span>ReserveFlow · A little more organized.</span>
          <span>All times shown in Asia/Colombo</span>
        </footer>
      </div>
    </div>
  );
}
