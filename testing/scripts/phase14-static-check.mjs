import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const requiredScripts = [
  "test:unit",
  "test:unit:coverage",
  "typecheck",
  "test:e2e",
  "test:performance:budgets",
  "test:manifest",
  "test:phase14:static",
];
const missingScripts = requiredScripts.filter((script) => !packageJson.scripts?.[script]);

const packagePath = join(root, "packages/testing/package.json");
const testingPackageExists = existsSync(packagePath);
const tsconfig = JSON.parse(readFileSync(join(root, "tsconfig.base.json"), "utf8"));
const hasTestingPath = Boolean(tsconfig.compilerOptions?.paths?.["@inkroute/testing"]);

if (missingScripts.length > 0 || !testingPackageExists || !hasTestingPath) {
  console.error(JSON.stringify({ missingScripts, testingPackageExists, hasTestingPath }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, scripts: requiredScripts, testingPackageExists, hasTestingPath }, null, 2));
