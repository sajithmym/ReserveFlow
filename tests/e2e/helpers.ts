import { expect, type Page } from "@playwright/test";
import { APP_NAME } from "../../src/config/settings";
export async function login(page: Page, role: "ADMIN" | "MEMBER") {
  try {
    await page.goto("/login");
    await expect(page).toHaveTitle(`Sign in · ${APP_NAME}`);
    for (let attempt = 0; attempt < 2; attempt++) {
      await page.getByLabel("Email address").fill(process.env[`SEED_${role}_EMAIL`]!);
      await page
        .getByLabel("Password", { exact: true })
        .fill(process.env[`SEED_${role}_PASSWORD`]!);
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/auth/sign-in/email") &&
          response.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      const response = await responsePromise;
      if (response.status() !== 429 || attempt === 1) break;
      await expect(page.getByRole("alert").filter({ hasText: "Too many attempts" })).toBeVisible();
      await page.getByLabel("Password", { exact: true }).fill("");
      // Several scenarios share localhost's IP. Respect the real server's retry window.
      const retrySeconds = Number(response.headers()["x-retry-after"]);
      expect(retrySeconds).toBeGreaterThan(0);
      expect(retrySeconds).toBeLessThanOrEqual(60);
      await page.waitForTimeout(retrySeconds * 1000);
    }
    await expect(page.getByRole("heading", { name: /^Hello,/ })).toBeVisible({ timeout: 45000 });
  } finally {
    if (!page.isClosed())
      await page.locator("#password").evaluateAll((fields) => {
        for (const field of fields)
          if (field instanceof HTMLInputElement) {
            field.value = "";
            field.removeAttribute("value");
          }
      });
  }
}
