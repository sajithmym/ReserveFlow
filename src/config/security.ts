// Server policy constants; no credentials or private connection values belong here.
export const SECURITY = {
  authBodyBytes: 8192,
  authBodyTimeoutMs: 10000,
  rateWindowSeconds: 60,
  authRequestsPerWindow: 30,
  signInRequestsPerWindow: 5,
  managementLock: 724091,
} as const;

export const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
