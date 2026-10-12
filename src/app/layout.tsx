import { APP_NAME } from "@/config/settings";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { headers } from "next/headers";
import { CspNonce } from "@/components/ui/csp-nonce";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} · Your workspace, in sync`, template: `%s · ${APP_NAME}` },
  description: "Find shared resources, reserve a time, and keep your team's schedule in sync.",
};
export default async function RootLayout({ children }: { children: ReactNode }) {
  await connection();
  const nonce = (await headers()).get("x-nonce") ?? "";
  return (
    <html lang="en">
      <body>
        <CspNonce nonce={nonce} />
        {children}
      </body>
    </html>
  );
}
