import "dotenv/config";
import { getDemoAccounts } from "./demo-accounts.mjs";
const { ADMIN } = getDemoAccounts();
const base = process.env.BETTER_AUTH_URL;
const response = await fetch(`${base}/api/auth/sign-in/email`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: base },
  body: JSON.stringify({
    email: ADMIN.email,
    password: ADMIN.password,
  }),
});
const cookie = response.headers
  .getSetCookie()
  .map((value) => value.split(";")[0])
  .join("; ");
console.log("Sign-in HTTP status:", response.status, "Session cookie issued:", !!cookie);
const session = await fetch(`${base}/api/auth/get-session`, { headers: { cookie } });
const data = await session.json();
console.log("Session lookup status:", session.status, "Authenticated user returned:", !!data?.user);
const page = await fetch(base, { headers: { cookie }, redirect: "manual" });
const html = await page.text();
console.log(
  "Dashboard status:",
  page.status,
  "Redirected to login:",
  page.headers.get("location") === "/login",
  "Greeting rendered:",
  html.includes("Hello,"),
);
await fetch(`${base}/api/auth/sign-out`, {
  method: "POST",
  headers: { cookie, origin: base, "content-type": "application/json" },
  body: "{}",
});
