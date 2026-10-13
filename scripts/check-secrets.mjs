import "dotenv/config";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { DEMO_ACCOUNTS } from "./demo-accounts.mjs";
import { parse } from "dotenv";

const keys = [
  "BETTER_AUTH_SECRET",
  "DB_PASSWORD",
  "MIGRATION_DB_PASSWORD",
  "TEST_DB_PASSWORD",
  "ADMIN_BOOTSTRAP_PASSWORD",
  "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
];
const configurations = [process.env];
if (existsSync(".env.test.local")) configurations.push(parse(readFileSync(".env.test.local")));
const values = configurations
  .flatMap((environment) => keys.map((key) => environment[key]))
  .filter((value) => value && value.length >= 12);
if (!values.length)
  throw new Error("Private environment configuration is required for a meaningful secret scan.");
const git = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
  encoding: "utf8",
  windowsHide: true,
});
if (git.status !== 0) throw new Error("Could not inspect Git-visible source paths.");
// Unstaged deletions still appear in git ls-files; scan only files present on disk.
const files = [...new Set(git.stdout.split("\0").filter(Boolean))].filter(existsSync);
const browserFiles = [];
function collect(directory) {
  if (!existsSync(directory)) return;
  for (const name of readdirSync(directory)) {
    const file = join(directory, name);
    if (statSync(file).isDirectory()) collect(file);
    else if (/\.(js|json|map)$/.test(file)) {
      files.push(file);
      browserFiles.push(file);
    }
  }
}
collect(".next/static");
const exposed = files.filter((file) => {
  const content = readFileSync(file, "utf8");
  return values.some((value) => content.includes(value));
});
// Demo logins are deliberately public in docs/scripts, but do not belong in app bundles.
const demoPasswords = Object.values(DEMO_ACCOUNTS).map((account) => account.password);
for (const file of browserFiles) {
  const content = readFileSync(file, "utf8");
  if (demoPasswords.some((password) => content.includes(password))) exposed.push(file);
}
if (exposed.length) {
  console.error("Private configuration was found in these source/browser files:", exposed);
  process.exit(1);
}
console.log(
  `PASS: No configured private credentials found in ${files.length} Git-visible source and production browser files.`,
);
