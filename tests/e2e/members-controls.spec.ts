import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "node:crypto";
import { formatInTimeZone } from "date-fns-tz";
import { login } from "./helpers";
import { TEST_ORIGIN } from "./environment";
import { DATE_FORMATS, TIME_ZONE } from "../../src/config/settings";
if (process.env.LOCAL_POSTGRES !== "true")
  throw new Error("Browser tests require local demonstration data.");
const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL,
  }),
});
const suffix = randomUUID().slice(0, 8),
  email = `${suffix}@e2e.test.local`,
  password = `Test-only-${randomUUID()}`;
let memberId = "",
  resourceId = "";
async function choose(page: Page, label: string, query: string) {
  const input = page.getByRole("combobox", { name: label, exact: true });
  await input.click();
  await input.fill(query);
  await input.press("ArrowDown");
  await input.press("Enter");
}
test.afterAll(async () => {
  const member = await db.user.findUnique({ where: { email } });
  if (resourceId) {
    await db.reservation.deleteMany({ where: { resourceId } });
    await db.resource.delete({ where: { id: resourceId } });
  }
  if (member) {
    await db.reservation.deleteMany({ where: { userId: member.id } });
    await db.auditEvent.deleteMany({ where: { actorId: member.id } });
    await db.user.delete({ where: { id: member.id } });
  }
  await db.$disconnect();
});
test("member CRUD, session revocation, searchable controls, calendars and mobile", async ({
  browser,
}) => {
  test.setTimeout(180000);
  const adminContext = await browser.newContext(),
    admin = await adminContext.newPage();
  const memberContext = await browser.newContext(),
    member = await memberContext.newPage();
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  for (const page of [admin, member]) {
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      // The login helper verifies and respects the auth retry window, then asserts success.
      // Chromium still reports the handled HTTP 429 as a resource console error.
      if (
        message.location().url === `${TEST_ORIGIN}/api/auth/sign-in/email` &&
        message.text() ===
          "Failed to load resource: the server responded with a status of 429 (Too Many Requests)"
      )
        return;
      consoleErrors.push(message.text());
    });
  }
  try {
    await login(admin, "ADMIN");
    await admin
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .getByRole("link", { name: "Members", exact: true })
      .click();
    await admin.getByRole("link", { name: "Add member", exact: true }).click();
    await admin.getByLabel("Full name").fill(`Teammate ${suffix}`);
    await admin.getByLabel("Email address").fill(email);
    await choose(admin, "Role", "Member");
    try {
      await admin.getByLabel("Initial password").fill(password);
      await admin.getByRole("button", { name: "Create member", exact: true }).click();
    } finally {
      await admin.locator("#password").evaluateAll((fields) => {
        for (const field of fields) if (field instanceof HTMLInputElement) field.value = "";
      });
    }
    await expect(
      admin.getByRole("heading", { name: `Teammate ${suffix}`, exact: true }),
    ).toBeVisible();
    memberId = new URL(admin.url()).pathname.split("/").at(-1)!;
    await admin.goto(`/members?q=${email}`);
    await expect(admin.getByRole("table")).toContainText(email);
    await expect(
      admin.getByRole("link", { name: `View Teammate ${suffix}`, exact: true }),
    ).toBeVisible();
    await expect(
      admin.getByRole("link", { name: `Edit Teammate ${suffix}`, exact: true }),
    ).toBeVisible();
    await expect(
      admin.getByRole("button", { name: `Delete Teammate ${suffix}`, exact: true }),
    ).toBeVisible();
    await admin.getByRole("link", { name: `View Teammate ${suffix}`, exact: true }).click();
    await expect(admin).toHaveURL(new RegExp(`/members/${memberId}$`));
    await admin.goto(`/members?q=${email}`);
    await admin.getByRole("link", { name: `Edit Teammate ${suffix}`, exact: true }).click();
    await admin.getByLabel("Full name").fill("This change should be discarded");
    await admin.getByRole("link", { name: "Cancel", exact: true }).click();
    await expect(admin).toHaveURL(/\/members$/);
    expect((await db.user.findUniqueOrThrow({ where: { id: memberId } })).name).toBe(
      `Teammate ${suffix}`,
    );
    await admin.goto(`/members?q=${email}`);
    const role = admin.getByRole("combobox", { name: "Filter by role" });
    await role.fill("no-such-role");
    await expect(admin.getByRole("status").filter({ hasText: "No options found" })).toBeVisible();
    await role.press("Escape");
    await expect(role).toHaveValue("");
    await choose(admin, "Filter by role", "Administrator");
    await admin.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(admin.getByText("No members found", { exact: true })).toBeVisible();
    await admin.getByRole("button", { name: "Clear role", exact: true }).click();
    await expect(role).toHaveValue("");
    await admin.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(admin.getByRole("table")).toContainText(email);
    // Authenticate the newly provisioned account through real Better Auth.
    const signedIn = await memberContext.request.post("/api/auth/sign-in/email", {
      data: { email, password },
    });
    expect(signedIn.ok()).toBe(true);
    await member.goto("/");
    await expect(member.getByRole("heading", { name: /^Hello,/ })).toBeVisible();
    await expect(member.getByRole("link", { name: "Members", exact: true })).toHaveCount(0);
    await member.goto(`/members/${memberId}/edit`);
    await expect(member).toHaveURL(/\/$/);
    // Replay the actual member action as a member and as an anonymous actor.
    await admin.goto(`/members/${memberId}/edit`);
    await admin.getByLabel("Full name").fill(`Updated ${suffix}`);
    const actionRequest = admin.waitForRequest(
      (request) => request.method() === "POST" && !!request.headers()["next-action"],
    );
    await admin.getByRole("button", { name: "Save changes", exact: true }).click();
    const actionId = (await actionRequest).headers()["next-action"];
    await expect(admin).toHaveURL(/\/members$/);
    await expect(admin.getByRole("table")).toContainText(`Updated ${suffix}`);
    const payload = [
      memberId,
      { name: "Forged admin", email, role: "ADMIN", isActive: true, password: "" },
    ];
    const denied = await memberContext.request.post(`/members/${memberId}/edit`, {
      headers: {
        "next-action": actionId,
        "content-type": "text/plain;charset=UTF-8",
        origin: TEST_ORIGIN,
      },
      data: JSON.stringify(payload),
    });
    expect(await denied.text()).toContain("FORBIDDEN");
    const anonymous = await browser.newContext();
    try {
      const response = await anonymous.request.post(`/members/${memberId}/edit`, {
        headers: {
          "next-action": actionId,
          "content-type": "text/plain;charset=UTF-8",
          origin: TEST_ORIGIN,
        },
        data: JSON.stringify(payload),
      });
      expect(await response.text()).toContain("UNAUTHENTICATED");
      await anonymous.newPage().then(async (page) => {
        await page.goto("/");
        await expect(page).toHaveURL(/\/login$/);
      });
    } finally {
      await anonymous.close();
    }
    expect((await db.user.findUniqueOrThrow({ where: { id: memberId } })).role).toBe("MEMBER");
    const resource = await db.resource.create({
      data: { name: `Control Room ${suffix}`, category: "Meeting room" },
    });
    resourceId = resource.id;
    await member.goto("/reservations/new");
    await choose(member, "Resource", resource.name);
    await expect(member.locator('input[type="hidden"][name="resourceId"]')).toHaveValue(resourceId);
    const day = formatInTimeZone(
      new Date(Date.now() + 86400000 * 15),
      TIME_ZONE,
      DATE_FORMATS.dateInput,
    );
    await member.getByLabel("Purpose of reservation").fill(`Member booking ${suffix}`);
    await member.getByLabel("Start date & time", { exact: true }).fill(`${day}T09:00`);
    await member.getByLabel("End date & time", { exact: true }).fill(`${day}T10:00`);
    await member.screenshot({ path: ".local/qa/reservation-form-desktop.png" });
    await member.getByRole("button", { name: "Choose Start date & time from calendar" }).click();
    const calendar = member.getByRole("dialog");
    await expect(calendar.getByRole("grid")).toBeVisible();
    await member.screenshot({ path: ".local/qa/calendar-desktop.png" });
    await member.setViewportSize({ width: 390, height: 844 });
    const calendarBounds = await calendar.boundingBox();
    expect(calendarBounds).not.toBeNull();
    expect(calendarBounds!.x).toBeGreaterThanOrEqual(0);
    expect(calendarBounds!.x + calendarBounds!.width).toBeLessThanOrEqual(390);
    expect(calendarBounds!.y).toBeGreaterThanOrEqual(0);
    expect(calendarBounds!.y + calendarBounds!.height).toBeLessThanOrEqual(844);
    await member.screenshot({ path: ".local/qa/calendar-mobile.png" });
    await member.setViewportSize({ width: 1280, height: 720 });
    const selectedDay = calendar.locator('button[tabindex="0"][data-date]');
    await selectedDay.press("ArrowRight");
    await calendar.locator('button[tabindex="0"][data-date]').press("ArrowLeft");
    await calendar.locator('button[tabindex="0"][data-date]').press("Enter");
    await expect(member.getByLabel("Start date & time", { exact: true })).toHaveValue(
      `${day}T09:00`,
    );
    // Month/year controls handle leap years and preserve the time portion.
    await member.getByRole("button", { name: "Choose Start date & time from calendar" }).click();
    await calendar.getByRole("combobox", { name: "Year", exact: true }).selectOption("2028");
    await calendar.getByRole("combobox", { name: "Month", exact: true }).selectOption("1");
    await calendar.locator('[data-date="2028-02-29"]').click();
    await expect(member.getByLabel("Start date & time", { exact: true })).toHaveValue(
      "2028-02-29T09:00",
    );
    await member.getByRole("button", { name: "Choose Start date & time from calendar" }).click();
    await calendar.getByRole("combobox", { name: "Year", exact: true }).selectOption("2029");
    await expect(calendar.locator('button[tabindex="0"][data-date]')).toHaveAttribute(
      "data-date",
      "2029-02-28",
    );
    await calendar.getByRole("button", { name: "Today", exact: true }).click();
    const today = formatInTimeZone(new Date(), TIME_ZONE, DATE_FORMATS.dateInput);
    await expect(member.getByLabel("Start date & time", { exact: true })).toHaveValue(
      `${today}T09:00`,
    );
    await member.getByLabel("Start date & time", { exact: true }).fill(`${day}T09:00`);
    await member.getByRole("button", { name: "Check availability", exact: true }).click();
    await expect(member.getByText(/This time slot is currently available/)).toBeVisible();
    await member.getByRole("button", { name: "Confirm reservation", exact: true }).click();
    await expect(
      member.getByRole("heading", { name: `Member booking ${suffix}`, exact: true }),
    ).toBeVisible();
    expect((await db.reservation.findFirstOrThrow({ where: { resourceId } })).userId).toBe(
      memberId,
    );
    await admin.goto(`/reservations?memberId=${memberId}`);
    await expect(admin.getByRole("table")).toContainText(`Member booking ${suffix}`);
    await admin
      .getByRole("button", { name: "Choose Date in Sri Lanka time from calendar" })
      .click();
    await admin
      .getByRole("dialog")
      .getByRole("button", { name: "Next month", exact: true })
      .click();
    const date = await admin
      .getByRole("dialog")
      .locator('button[tabindex="0"][data-date]')
      .getAttribute("data-date");
    await admin.getByRole("dialog").locator('button[tabindex="0"][data-date]').press("Enter");
    await expect(admin.getByLabel("Date in Sri Lanka time", { exact: true })).toHaveValue(date!);
    await admin.getByRole("button", { name: "Clear Date in Sri Lanka time", exact: true }).click();
    await expect(admin.getByLabel("Date in Sri Lanka time", { exact: true })).toHaveValue("");
    await admin.goto(`/members?q=${email}`);
    await admin.getByRole("button", { name: `Delete Updated ${suffix}`, exact: true }).click();
    await expect(admin.getByRole("dialog")).toContainText("reservations and history are retained");
    await admin
      .getByRole("dialog")
      .getByRole("button", { name: "Keep as is", exact: true })
      .click();
    expect((await db.user.findUniqueOrThrow({ where: { id: memberId } })).isActive).toBe(true);
    await admin.getByRole("button", { name: `Delete Updated ${suffix}`, exact: true }).click();
    await admin
      .getByRole("dialog")
      .getByRole("button", { name: "Delete member", exact: true })
      .click();
    await expect(admin.getByText("Inactive", { exact: true })).toBeVisible();
    await member.goto("/reservations");
    await expect(member).toHaveURL(/\/login$/);
    expect(await db.session.count({ where: { userId: memberId } })).toBe(0);
    expect((await db.reservation.findFirstOrThrow({ where: { resourceId } })).status).toBe(
      "CONFIRMED",
    );
    await admin.goto(`/members/${memberId}`);
    await admin.getByRole("button", { name: "Activate member", exact: true }).click();
    await admin
      .getByRole("dialog")
      .getByRole("button", { name: "Activate member", exact: true })
      .click();
    await expect(admin.getByText("Active", { exact: true })).toBeVisible();
    await admin.goto(`/members/${memberId}/edit`);
    await choose(admin, "Role", "Administrator");
    await admin.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(admin).toHaveURL(/\/members$/);
    await expect(admin.getByRole("row").filter({ hasText: email })).toContainText("Administrator");
    await admin.setViewportSize({ width: 390, height: 844 });
    await admin.goto("/members");
    await admin.getByRole("button", { name: "Open navigation", exact: true }).click();
    await admin.getByRole("dialog").getByRole("link", { name: "Members", exact: true }).click();
    expect(await admin.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await admin.screenshot({ path: ".local/qa/members-mobile.png" });
    await admin.setViewportSize({ width: 1360, height: 900 });
    await admin.screenshot({ path: ".local/qa/members-desktop.png" });
    // Cancelling logout keeps the session; confirming revokes it.
    await admin.getByRole("button", { name: "Sign out", exact: true }).click();
    await admin
      .getByRole("dialog", { name: "Sign out?", exact: true })
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    await admin.reload();
    await expect(admin).toHaveURL(/\/members$/);
    await admin.setViewportSize({ width: 390, height: 844 });
    await admin.getByRole("button", { name: "Open navigation", exact: true }).click();
    await admin
      .getByRole("dialog", { name: "ReserveFlow", exact: true })
      .getByRole("button", { name: "Sign out", exact: true })
      .click();
    await admin
      .getByRole("dialog", { name: "Sign out?", exact: true })
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    await expect(admin.getByRole("dialog", { name: "ReserveFlow", exact: true })).toBeVisible();
    await admin
      .getByRole("dialog", { name: "ReserveFlow", exact: true })
      .getByRole("button", { name: "Sign out", exact: true })
      .click();
    await admin
      .getByRole("dialog", { name: "Sign out?", exact: true })
      .getByRole("button", { name: "Sign out", exact: true })
      .click();
    await expect(admin).toHaveURL(/\/login$/);
    await admin.goto("/members");
    await expect(admin).toHaveURL(/\/login$/);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } finally {
    await adminContext.close();
    await memberContext.close();
  }
});
