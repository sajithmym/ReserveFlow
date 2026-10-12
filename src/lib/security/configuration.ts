import { LOCAL_HOSTS } from "@/config/security";

type Environment = Record<string, string | undefined>;
const placeholder = /CHANGE_ME|REPLACE_WITH|YOUR_UNIQUE|YOUR_PRIVATE|YOUR_BASE64/;

export function authConfiguration(environment: Environment) {
  const secret = environment.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32 || placeholder.test(secret))
    throw new Error("Set BETTER_AUTH_SECRET to a private random secret of at least 32 characters.");
  let url: URL;
  try {
    url = new URL(environment.BETTER_AUTH_URL ?? "");
  } catch {
    throw new Error("BETTER_AUTH_URL must be an explicit HTTP or HTTPS application origin.");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("BETTER_AUTH_URL must contain only the application origin.");
  if (url.protocol !== "https:" && !LOCAL_HOSTS.has(url.hostname))
    throw new Error("Non-local application origins require HTTPS.");
  const ipHeader = environment.AUTH_TRUSTED_IP_HEADER;
  if (ipHeader && !["x-real-ip", "cf-connecting-ip", "x-forwarded-for"].includes(ipHeader))
    throw new Error("AUTH_TRUSTED_IP_HEADER must name a supported, proxy-overwritten IP header.");
  return {
    origin: url.origin,
    secret,
    secureCookies: url.protocol === "https:",
    ipHeaders: ipHeader ? [ipHeader] : [],
  };
}

export function databaseConnection(value: string | undefined) {
  let connection: URL;
  try {
    connection = new URL(value ?? "");
    if (
      !/^postgres(?:ql)?:$/.test(connection.protocol) ||
      !connection.hostname ||
      connection.pathname === "/"
    )
      throw new Error("invalid");
  } catch {
    throw new Error("Configure a PostgreSQL DATABASE_URL in your private environment.");
  }
  if (decodeURIComponent(connection.username) === "postgres")
    throw new Error("DATABASE_URL must use a restricted runtime role, not the postgres superuser.");
  if (placeholder.test(connection.password))
    throw new Error("Replace the DATABASE_URL password placeholder.");
  if (
    !LOCAL_HOSTS.has(connection.hostname) &&
    (connection.searchParams.get("sslmode") !== "verify-full" ||
      connection.searchParams.get("ssl") === "false")
  )
    throw new Error(
      "Remote database connections require certificate-verified TLS (sslmode=verify-full).",
    );
  return value!;
}
