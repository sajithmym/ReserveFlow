import "dotenv/config";
import { databaseUrl } from "../src/lib/db/config.mjs";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { formatInTimeZone } from "date-fns-tz";
import { getDemoAccounts } from "./demo-accounts.mjs";
const demoAccounts = getDemoAccounts();

if (process.env.LOCAL_POSTGRES !== "true")
  throw new Error("Recording is restricted to the local demo environment.");
const baseURL = process.env.BETTER_AUTH_URL!;
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl(process.env, "migration") }),
});
mkdirSync("artifacts", { recursive: true });
mkdirSync("docs/screenshots", { recursive: true });
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || "chrome" });
const context = await browser.newContext({
  baseURL,
  viewport: { width: 1360, height: 900 },
  recordVideo: { dir: "artifacts", size: { width: 1360, height: 900 } },
});
let resourceId = "";
async function signIn(role: "ADMIN" | "MEMBER") {
  const response = await context.request.post("/api/auth/sign-in/email", {
    headers: { origin: baseURL },
    data: {
      email: demoAccounts[role].email,
      password: demoAccounts[role].password,
    },
  });
  if (!response.ok())
    throw new Error(
      `Demo sign-in failed with status ${response.status()}. Wait for the login rate-limit window before retrying.`,
    );
}
// Authenticate before a page is created: no credential input appears in the recording.
await signIn("ADMIN");
const page = await context.newPage();
const video = page.video()!;
const day = formatInTimeZone(new Date(Date.now() + 86400000 * 2), "Asia/Colombo", "yyyy-MM-dd");
async function hold(caption: string, duration: number) {
  await page.evaluate((text) => {
    let element = document.getElementById("demo-caption");
    if (!element) {
      element = document.createElement("div");
      element.id = "demo-caption";
      Object.assign(element.style, {
        position: "fixed",
        bottom: "18px",
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: "1100px",
        width: "max-content",
        background: "#064e3bee",
        color: "white",
        padding: "13px 22px",
        borderRadius: "10px",
        font: "15px/1.5 Arial, sans-serif",
        zIndex: "9999",
        boxShadow: "0 4px 20px #0002",
        pointerEvents: "none",
      });
      document.body.append(element);
    }
    element.textContent = text;
  }, caption);
  console.log(caption);
  await new Promise((done) => setTimeout(done, duration));
}
async function book(start: string, end: string, title: string) {
  await page.goto(`/reservations/new?resourceId=${resourceId}`);
  await page.getByLabel("Purpose of reservation").fill(title);
  await page.getByLabel("Start date & time", { exact: true }).fill(`${day}T${start}`);
  await page.getByLabel("End date & time", { exact: true }).fill(`${day}T${end}`);
  await page.getByRole("button", { name: "Confirm reservation", exact: true }).click();
}
try {
  await page.goto("/");
  await page.getByRole("heading", { name: /^Hello,/ }).waitFor();
  await page.screenshot({ path: "docs/screenshots/overview.png", fullPage: true });
  await hold(
    "ReserveFlow brings shared resources and reservations together, with real PostgreSQL data.",
    24000,
  );
  await page.goto("/resources");
  await page.getByRole("heading", { name: "Resources", exact: true }).waitFor();
  await page.screenshot({ path: "docs/screenshots/resources.png", fullPage: true });
  await hold(
    "Browse rooms, workspaces, equipment, and vehicles. Availability is shown for the current time.",
    18000,
  );
  await page.goto("/resources/new");
  await page.getByLabel("Resource name").fill("Team planning room");
  await page.getByLabel("Capacity (optional)").fill("8");
  await page.getByLabel("Location (optional)").fill("Level 2 · South wing");
  await page
    .getByLabel("Description (optional)")
    .fill("A quiet room for team planning and focused collaboration.");
  await hold(
    "Administrators manage resources. Members can browse and manage only their own reservations.",
    18000,
  );
  await page.getByRole("button", { name: "Create resource" }).click();
  await page.getByRole("heading", { name: "Team planning room", exact: true }).waitFor();
  resourceId = new URL(page.url()).pathname.split("/").at(-1)!;
  await hold("This resource was created through the app and persists in PostgreSQL.", 14000);
  await context.request.post("/api/auth/sign-out", { headers: { origin: baseURL }, data: {} });
  await signIn("MEMBER");
  await book("09:00", "10:00", "Team planning session");
  await page.getByRole("heading", { name: "Team planning session", exact: true }).waitFor();
  const bookingId = new URL(page.url()).pathname.split("/").at(-1)!;
  await hold(
    "A member reserves 09:00–10:00. Inputs and displayed times use Sri Lanka time, UTC+05:30.",
    18000,
  );
  await page.reload();
  await book("09:30", "10:30", "A conflicting session");
  await page.getByRole("alert").filter({ hasText: "That resource is booked" }).waitFor();
  await hold(
    "An overlapping request is rejected safely. The PostgreSQL exclusion constraint is the final authority.",
    24000,
  );
  await book("10:00", "11:00", "Back-to-back discussion");
  await page.getByRole("heading", { name: "Back-to-back discussion", exact: true }).waitFor();
  await hold(
    "Adjacent slots are allowed: half-open intervals let one reservation end when the next begins.",
    18000,
  );
  await page.goto(`/reservations/${bookingId}`);
  await page.getByRole("button", { name: "Cancel reservation", exact: true }).click();
  await hold(
    "Cancellation asks for confirmation. The record stays in history and its time becomes available.",
    10000,
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel reservation", exact: true })
    .click();
  await page.getByText("Cancelled", { exact: true }).waitFor();
  await book("09:00", "10:00", "The freed time slot");
  await page.getByRole("heading", { name: "The freed time slot", exact: true }).waitFor();
  await hold(
    "A new confirmed reservation can now use the cancelled slot. No historical record is erased.",
    15000,
  );
  await page.goto(`/reservations?resourceId=${resourceId}`);
  await hold(
    "Search and resource, date, and status filters keep reservation history useful. Members see only their own.",
    14000,
  );
  await page.goto(pathToFileURL(resolve("docs/erd.svg")).toString());
  await page.evaluate(() => {
    document.documentElement.style.width = "100vw";
    document.documentElement.style.height = "100vh";
  });
  await new Promise((done) => setTimeout(done, 23000));
  console.log(
    "ER diagram: actual six-table schema, foreign keys, range CHECK and GiST exclusion constraint.",
  );
  await page.goto("/help");
  await hold(
    "Sessions, Argon2id, origin checks, and server authorization protect the flows. Distributed rate limiting and recovery are deferred.",
    18000,
  );
  await page.goto("/");
  await hold(
    "Verified: domain tests, real PostgreSQL concurrency, browser flows, TypeScript, lint, and a production build.",
    12000,
  );
} finally {
  await context.close();
  await video.saveAs(resolve("artifacts/reserveflow-demo.webm"));
  await browser.close();
  if (resourceId) {
    await db.reservation.deleteMany({ where: { resourceId } });
    await db.resource.delete({ where: { id: resourceId } });
  }
  await db.$disconnect();
}
console.log(
  "Saved actual screen recording to artifacts/reserveflow-demo.webm. It has captions and no audio narration.",
);
