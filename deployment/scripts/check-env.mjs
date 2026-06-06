#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
};

const envPath = resolve(process.cwd(), getArg("--env", ".env.example"));
const target = getArg("--target", "production");
const strictValues = args.includes("--strict-values");
const contractPath = resolve(process.cwd(), "deployment/manifests/environment-contract.json");

if (!existsSync(contractPath)) {
  console.error("Missing deployment/manifests/environment-contract.json");
  process.exit(1);
}

if (!existsSync(envPath)) {
  console.error(`Missing env file: ${envPath}`);
  process.exit(1);
}

const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const envText = readFileSync(envPath, "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      if (separator === -1) return [line.trim(), ""];
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^"|"$/g, "")];
    })
);

const placeholderFragments = ["", "replace-with", "USER:PASSWORD", "HOST", "example", "scaffolded_not_reviewed"];
const hasUsableValue = (value) => typeof value === "string" && value.trim().length > 0 && !placeholderFragments.some((fragment) => fragment && value.includes(fragment));

const rows = contract.map((item) => {
  const present = Object.prototype.hasOwnProperty.call(env, item.name);
  const usable = hasUsableValue(env[item.name]);
  const blocks = target === "production" && item.requiredForProduction && (!present || (strictValues && !usable));
  const warning = present && !usable;
  return {
    name: item.name,
    group: item.group,
    present,
    usable,
    requiredForProduction: item.requiredForProduction,
    status: blocks ? "block" : warning ? "warn" : "pass"
  };
});

const blockers = rows.filter((row) => row.status === "block");
const warnings = rows.filter((row) => row.status === "warn");
console.log(`InkRoute environment check: ${envPath}`);
console.log(`Target: ${target}; strict values: ${strictValues ? "yes" : "no"}`);
console.log(`Pass: ${rows.filter((row) => row.status === "pass").length}; warn: ${warnings.length}; block: ${blockers.length}`);

for (const row of rows) {
  const marker = row.status === "pass" ? "✓" : row.status === "warn" ? "!" : "x";
  console.log(`${marker} ${row.name} [${row.group}] ${row.status}`);
}

if (blockers.length > 0) {
  console.error("Production-blocking variables missing or placeholder:");
  for (const blocker of blockers) console.error(`- ${blocker.name}`);
  process.exit(1);
}
