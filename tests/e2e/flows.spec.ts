import "dotenv/config";
import { login } from "./helpers";
import { TEST_ORIGIN } from "./environment";
import { TIME_ZONE, DATE_FORMATS, APP_NAME } from "../../src/config/settings";
import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { formatInTimeZone } from "date-fns-tz";
import { randomUUID } from "node:crypto";
import { getDemoAccounts } from "../../scripts/demo-accounts.mjs";

if (process.env.LOCAL_POSTGRES !== "true")
  throw new Error("Browser tests require the isolated local demonstration environment.");

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL,
  }),
});
const suffix = randomUUID().slice(0, 8);
const demoAccounts = getDemoAccounts();
const resourceName = `E2E Room ${suffix}`;
const purpose = `Planning ${suffix}`;
let resourceId = "";
let actionId = "";
const day = formatInTimeZone(
  new Date(Date.now() + 86400000 * 12),
  TIME_ZONE,
  DATE_FORMATS.dateInput,
);
async function book(page: Page, start: string, end: string, title = purpose) {
  await page.goto(`/reservations/new?resourceId=${resourceId}`);
  await page.getByLabel("Purpose of reservation").fill(title);
  await page.getByLabel("Start date & time", { exact: true }).fill(`${day}T${start}`);
  await page.getByLabel("End date & time", { exact: true }).fill(`${day}T${end}`);
  await page.getByRole("button", { name: "Confirm reservation", exact: true }).click();
}
async function action(request: APIRequestContext, origin = TEST_ORIGIN) {
  return request.post("/resources/new", {
    headers: { "next-action": actionId, "content-type": "text/plain;charset=UTF-8", origin },
    data: JSON.stringify([
      null,
      {
        name: `Forbidden ${suffix}`,
        category: "Meeting room",
        location: "",
        description: "",
        capacity: "4",
      },
    ]),
  });
}
test.afterAll(async () => {
  if (resourceId) {
    await db.reservation.deleteMany({ where: { resourceId } });
    await db.resource.delete({ where: { id: resourceId } });
  }
  await db.resource.deleteMany({ where: { name: `Forbidden ${suffix}` } });
  await db.$disconnect();
});
test("admin and member flows, conflicts, persistence, ownership, and mobile navigation", async ({
  browser,
}) => {
  // This scenario spans both roles and many cold dev-server route compilations.
  test.setTimeout(180000);
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await login(admin, "ADMIN");
  await admin.goto("/resources/new");
  await admin.getByLabel("Resource name").fill(resourceName);
  await admin.getByLabel("Capacity (optional)").fill("6");
  await admin.getByLabel("Location (optional)").fill("Test wing");
  const requestPromise = admin.waitForRequest(
    (r) => r.method() === "POST" && !!r.headers()["next-action"],
  );
  await admin.getByRole("button", { name: "Create resource" }).click();
  actionId = (await requestPromise).headers()["next-action"];
  await expect(admin.getByRole("heading", { name: resourceName, exact: true })).toBeVisible();
  resourceId = new URL(admin.url()).pathname.split("/").at(-1)!;
  await admin.getByRole("link", { name: "Edit details" }).click();
  await admin
    .getByLabel("Description (optional)")
    .fill("A resource created through a real browser.");
  await admin.getByRole("button", { name: "Save changes" }).click();
  await expect(admin.getByText("A resource created through a real browser.")).toBeVisible();

  const memberContext = await browser.newContext();
  const member = await memberContext.newPage();
  await login(member, "MEMBER");
  await member.goto("/resources");
  await expect(member.getByRole("link", { name: "Add resource" })).toHaveCount(0);
  await member
    .getByRole("main")
    .getByRole("textbox", { name: "Search resources", exact: true })
    .fill(resourceName);
  await member.getByRole("button", { name: "Apply" }).click();
  await expect(member.getByRole("heading", { name: resourceName })).toBeVisible();
  const forbidden = await action(memberContext.request);
  expect(await forbidden.text()).toContain("FORBIDDEN");
  const anonymous = await browser.newContext();
  const denied = await action(anonymous.request);
  expect(await denied.text()).toContain("UNAUTHENTICATED");
  const csrf = await action(adminContext.request, "https://untrusted.example");
  expect(csrf.status()).toBeGreaterThanOrEqual(400);
  expect(await db.resource.count({ where: { name: `Forbidden ${suffix}` } })).toBe(0);
  await anonymous.close();

  await book(member, "09:00", "10:00");
  await expect(member.getByRole("heading", { name: purpose, exact: true })).toBeVisible();
  const bookingId = new URL(member.url()).pathname.split("/").at(-1)!;
  await member.reload();
  await expect(member.getByText("Confirmed", { exact: true })).toBeVisible();
  await book(member, "09:30", "10:30", "Overlap attempt");
  await expect(member.getByRole("alert").filter({ hasText: "That resource is booked" })).toHaveText(
    "That resource is booked during the selected time. Try a different time.",
  );
  await expect(member.getByLabel("Purpose of reservation")).toHaveValue("Overlap attempt");
  await book(member, "10:00", "11:00", "Adjacent booking");
  await expect(member.getByRole("heading", { name: "Adjacent booking" })).toBeVisible();
  await member.goto(`/reservations/${bookingId}/edit`);
  await member.getByLabel("Start date & time", { exact: true }).fill(`${day}T12:00`);
  await member.getByLabel("End date & time", { exact: true }).fill(`${day}T13:00`);
  await member.getByRole("button", { name: "Save reservation" }).click();
  await expect(member.getByRole("heading", { name: purpose, exact: true })).toBeVisible();
  await member.getByRole("button", { name: "Cancel reservation", exact: true }).click();
  await member
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel reservation", exact: true })
    .click();
  await expect(member.getByText("Cancelled", { exact: true })).toBeVisible();
  await book(member, "12:00", "13:00", "Freed slot booking");
  await expect(member.getByRole("heading", { name: "Freed slot booking" })).toBeVisible();
  await book(admin, "14:00", "15:00", "Admin private purpose");
  await expect(admin.getByRole("heading", { name: "Admin private purpose" })).toBeVisible();
  const adminBooking = new URL(admin.url()).pathname;
  await member.goto(adminBooking);
  await expect(member.getByRole("heading", { name: "This page isn’t available" })).toBeVisible();
  await member.goto("/reservations?q=Admin%20private%20purpose");
  await expect(member.getByText("No reservations here yet")).toBeVisible();
  await admin.goto(`/resources/${resourceId}`);
  await admin.getByRole("button", { name: "Deactivate resource", exact: true }).click();
  await admin
    .getByRole("dialog")
    .getByRole("button", { name: "Deactivate resource", exact: true })
    .click();
  await expect(admin.getByText("Inactive resource", { exact: true })).toBeVisible();
  await member.goto(`/reservations/new?resourceId=${resourceId}`);
  await expect(
    member.getByRole("heading", { name: "This resource can’t be reserved" }),
  ).toBeVisible();
  await admin.getByRole("button", { name: "Activate resource", exact: true }).click();
  await admin
    .getByRole("dialog")
    .getByRole("button", { name: "Activate resource", exact: true })
    .click();
  await expect(admin.getByText("Active resource", { exact: true })).toBeVisible();
  await member.setViewportSize({ width: 390, height: 844 });
  await member.goto("/");
  await expect(member.getByRole("button", { name: "Open navigation" })).toBeVisible();
  await member.getByRole("button", { name: "Open navigation" }).click();
  await member.getByRole("dialog").getByRole("link", { name: "Resources", exact: true }).click();
  await expect(member.getByRole("heading", { name: "Resources", exact: true })).toBeVisible();
  expect(
    await member.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await member.screenshot({ path: ".local/qa/reservations-mobile.png" });
  await memberContext.close();
  await adminContext.close();
});
test("anonymous access, failed login, disabled users, auth CSRF, signup closure, and escaped text", async ({
  page,
  request,
}) => {
  const independentResource = await db.resource.create({
    data: { name: `E2E Security ${suffix}`, category: "Meeting room" },
  });
  const oldResourceId = resourceId;
  resourceId = independentResource.id;
  try {
    await page.goto("/resources");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page).toHaveTitle(`Sign in · ${APP_NAME}`);
    const signup = await request.post("/api/auth/sign-up/email", {
      data: { name: "Forged", email: "forged@test.local", password: "UnusablePassword" },
    });
    expect(signup.status()).toBe(403);
    const oversized = await request.post("/api/auth/sign-in/email", {
      data: { email: "x".repeat(9000), password: "wrong" },
    });
    expect(oversized.status()).toBe(413);
    const origin = await request.post("/api/auth/sign-in/email", {
      headers: { origin: "https://untrusted.example" },
      data: demoAccounts.MEMBER,
    });
    expect(origin.status()).toBe(403);
    await page.getByLabel("Email address").fill(demoAccounts.MEMBER.email);
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Unable to sign in" })).toBeVisible();
    await login(page, "MEMBER");
    const user = await db.user.findUniqueOrThrow({
      where: { email: demoAccounts.MEMBER.email },
    });
    await db.user.update({ where: { id: user.id }, data: { isActive: false } });
    try {
      await page.goto("/resources");
      await expect(page).toHaveURL(/\/login$/);
    } finally {
      await db.user.update({ where: { id: user.id }, data: { isActive: true } });
    }
    const xss = "<script>window.__reserveFlowXss = true</script>";
    await book(page, "16:00", "17:00", xss);
    await expect(page.getByRole("heading", { name: xss, exact: true })).toBeVisible();
    expect(await page.evaluate(() => "__reserveFlowXss" in window)).toBe(false);
  } finally {
    resourceId = oldResourceId;
    await db.reservation.deleteMany({ where: { resourceId: independentResource.id } });
    await db.resource.delete({ where: { id: independentResource.id } });
  }
});
