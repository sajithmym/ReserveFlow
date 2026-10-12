import type { NextConfig } from "next";

const production = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  logging: { serverFunctions: false, incomingRequests: false },
  serverExternalPackages: ["@node-rs/argon2", "pg"],
  experimental: { serverActions: { bodySizeLimit: "128kb" } },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          ...(production && process.env.BETTER_AUTH_URL?.startsWith("https://")
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
};
export default nextConfig;
