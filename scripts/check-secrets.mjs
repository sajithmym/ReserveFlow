import "dotenv/config";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const keys = [
  "BETTER_AUTH_SECRET",
  "SEED_ADMIN_PASSWORD",
  "SEED_MEMBER_PASSWORD",
  "LOCAL_DB_OWNER_PASSWORD",
  "LOCAL_DB_APP_PASSWORD",
  "DATABASE_URL",
  "MIGRATION_DATABASE_URL",
  "TEST_DATABASE_URL",
];
const values = keys.map((key) => process.env[key]).filter((value) => value && value.length >= 12);
if (!values.length)
  throw new Error("Private environment configuration is required for a meaningful secret scan.");
const git = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
  encoding: "utf8",
  windowsHide: true,
});
if (git.status !== 0) throw new Error("Could not inspect Git-visible source paths.");
const files = [...new Set(git.stdout.split("\0").filter(Boolean))];
function collect(directory) {
  if (!existsSync(directory)) return;
  for (const name of readdirSync(directory)) {
    const file = join(directory, name);
    if (statSync(file).isDirectory()) collect(file);
    else if (/\.(js|json|map)$/.test(file)) files.push(file);
  }
}
collect(".next/static");
const exposed = files.filter((file) => {
  const content = readFileSync(file, "utf8");
  return values.some((value) => content.includes(value));
});
if (exposed.length) {
  console.error("Private configuration was found in these source/browser files:", exposed);
  process.exit(1);
}
console.log(
  `PASS: No configured private credentials found in ${files.length} Git-visible source and production browser files.`,
);
