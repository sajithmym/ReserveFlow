export type DatabaseEnvironment = Record<string, string | undefined>;
export type DatabasePurpose = "runtime" | "migration" | "test";
export type DatabaseSettings = Record<
  "HOST" | "PORT" | "USERNAME" | "PASSWORD" | "DATABASE",
  string
> & { SSL_MODE?: string };
export function databaseSettings(
  environment?: DatabaseEnvironment,
  purpose?: DatabasePurpose,
): DatabaseSettings;
export function databaseUrl(environment?: DatabaseEnvironment, purpose?: DatabasePurpose): string;
export function isLocalPostgresDevelopment(environment?: DatabaseEnvironment): boolean;
