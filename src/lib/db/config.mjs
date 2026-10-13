// Shared by server-only database code and Node.js maintenance scripts.
// Never import this module from a Client Component or expose its output.
const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
const placeholder = /CHANGE_ME|REPLACE_WITH|YOUR_UNIQUE|YOUR_PRIVATE/;
const fields = ["HOST", "PORT", "USERNAME", "PASSWORD", "DATABASE", "SSL_MODE"];

export function databaseSettings(environment = process.env, purpose = "runtime") {
  if (!["runtime", "migration", "test"].includes(purpose))
    throw new Error("Unknown database configuration purpose.");
  if (purpose === "migration" && environment.DB_TARGET === "test")
    throw new Error(
      "DB_TARGET=test is for Prisma test migrations. Leave it unset for seed/admin/maintenance commands.",
    );
  const prefix = purpose === "runtime" ? "DB_" : `${purpose.toUpperCase()}_DB_`;
  const settings = Object.fromEntries(
    fields.map((field) => {
      const key = `${prefix}${field}`;
      const testIdentity =
        purpose === "test" && ["USERNAME", "PASSWORD", "DATABASE"].includes(field);
      return [field, environment[key] ?? (testIdentity ? undefined : environment[`DB_${field}`])];
    }),
  );
  for (const field of ["HOST", "PORT", "USERNAME", "PASSWORD", "DATABASE"]) {
    if (!settings[field] || placeholder.test(settings[field]))
      throw new Error(`Set ${prefix}${field} to a valid private database setting.`);
  }
  if (!/^\d+$/.test(settings.PORT) || Number(settings.PORT) < 1 || Number(settings.PORT) > 65535)
    throw new Error(`${prefix}PORT must be an integer between 1 and 65535.`);
  // Host must be a hostname/address, never a URL with embedded credentials or paths.
  if (!/^(?:\[[0-9a-fA-F:]+\]|[a-zA-Z0-9._-]+)$/.test(settings.HOST))
    throw new Error(`${prefix}HOST must be a hostname or bracketed IPv6 address.`);
  if ([".", ".."].includes(settings.DATABASE) || /[\x00-\x1f\x7f]/.test(settings.DATABASE))
    throw new Error(`${prefix}DATABASE must be a valid database name.`);
  if (settings.SSL_MODE && !["disable", "verify-full"].includes(settings.SSL_MODE))
    throw new Error(`${prefix}SSL_MODE must be disable or verify-full.`);
  if (!localHosts.has(settings.HOST) && settings.SSL_MODE !== "verify-full")
    throw new Error(
      "Remote database connections require certificate-verified TLS (DB_SSL_MODE=verify-full).",
    );
  return settings;
}

export function databaseUrl(environment = process.env, purpose = "runtime") {
  const settings = databaseSettings(environment, purpose);
  const encode = (value) =>
    encodeURIComponent(value).replace(
      /[!'()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  const url = new URL(
    `postgresql://${settings.HOST}:${settings.PORT}/${encode(settings.DATABASE)}`,
  );
  url.username = encode(settings.USERNAME);
  url.password = encode(settings.PASSWORD);
  if (settings.SSL_MODE) url.searchParams.set("sslmode", settings.SSL_MODE);
  return url.toString();
}

export function isLocalPostgresDevelopment(environment = process.env) {
  if (environment.NODE_ENV !== "development" || environment.DB_TARGET === "test") return false;
  const settings = databaseSettings(environment);
  let origin;
  try {
    origin = new URL(environment.BETTER_AUTH_URL ?? "");
  } catch {
    return false;
  }
  return (
    settings.USERNAME === "postgres" &&
    localHosts.has(settings.HOST) &&
    localHosts.has(origin.hostname) &&
    ["http:", "https:"].includes(origin.protocol)
  );
}
