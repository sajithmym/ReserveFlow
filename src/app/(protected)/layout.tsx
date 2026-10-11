import { requirePageUser } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/app-shell";
import type { ReactNode } from "react";
export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await requirePageUser();
  return <AppShell user={user}>{children}</AppShell>;
}
