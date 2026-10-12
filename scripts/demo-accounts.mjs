// Public local-demo login values, documented at the user's request.
// Keep this module in server-side scripts and tests; never import it into the app.
/** @type {Readonly<Record<'ADMIN' | 'MEMBER', Readonly<{email: string, password: string}>>>} */
export const DEMO_ACCOUNTS = Object.freeze({
  ADMIN: {
    email: "admin@reserveflow.local",
    password: "2c9ce316f45005f0dcdd71c1cb434fde1b6c6915222e026414a9ceed415bf869",
  },
  MEMBER: {
    email: "member@reserveflow.local",
    password: "5b00eb66ee81c3843f448df4379c72bae6a34c7d30187821cb7550734b6d5454",
  },
});

export function getDemoAccounts() {
  if (process.env.LOCAL_POSTGRES !== "true")
    throw new Error("Published demo accounts require the isolated LOCAL_POSTGRES=true cluster.");
  let connections;
  try {
    connections = [
      process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
      ...(process.env.DATABASE_URL ? [process.env.DATABASE_URL] : []),
    ].map((value) => new URL(value));
  } catch {
    throw new Error("Configure a local PostgreSQL connection before using demo accounts.");
  }
  if (
    process.env.NODE_ENV === "production" ||
    connections.some(
      (connection) =>
        !["postgres:", "postgresql:"].includes(connection.protocol) ||
        !["localhost", "127.0.0.1", "[::1]"].includes(connection.hostname) ||
        connection.port !== "54329",
    )
  )
    throw new Error("Published demo accounts are restricted to local development databases.");
  return DEMO_ACCOUNTS;
}
