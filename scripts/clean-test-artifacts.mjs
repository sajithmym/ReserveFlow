import { existsSync, realpathSync, rmSync } from "node:fs";
import { resolve, sep } from "node:path";

const workspace = realpathSync(resolve("."));
for (const name of ["test-results", "playwright-report"]) {
  const target = resolve(workspace, name);
  if (!existsSync(target)) continue;
  const actual = realpathSync(target);
  if (!actual.startsWith(workspace + sep) || actual !== target)
    throw new Error("Refusing to remove artifacts outside the intended workspace directory.");
  rmSync(actual, { recursive: true, force: true });
}
console.log("Removed generated browser-test artifacts from the verified workspace paths.");
