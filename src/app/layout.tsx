import { APP_NAME } from "@/config/settings";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} · Your workspace, in sync`, template: `%s · ${APP_NAME}` },
  description: "Find shared resources, reserve a time, and keep your team's schedule in sync.",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
