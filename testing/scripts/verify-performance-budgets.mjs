import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const manifestPath = join(root, "testing/manifests/performance-budget.json");

if (!existsSync(manifestPath)) {
  console.error("Missing performance budget manifest: testing/manifests/performance-budget.json");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const budgets = manifest.budgets ?? {};
const coreWebVitals = budgets.coreWebVitals ?? {};
const routeBudgets = Array.isArray(budgets.routeBudgets) ? budgets.routeBudgets : [];
const apiLoadTargets = Array.isArray(budgets.apiLoadTargets) ? budgets.apiLoadTargets : [];
const databaseQueryTargets = Array.isArray(budgets.databaseQueryTargets) ? budgets.databaseQueryTargets : [];
const imageOptimizationTargets = Array.isArray(budgets.imageOptimizationTargets) ? budgets.imageOptimizationTargets : [];

const failures = [];

function requireNumber(path, value, predicate = (item) => Number.isFinite(item) && item > 0) {
  if (!predicate(value)) failures.push(`${path} must be a positive finite number inside the agreed performance budget.`);
}

function requireArray(path, value, minLength) {
  if (!Array.isArray(value) || value.length < minLength) failures.push(`${path} must include at least ${minLength} entries.`);
}

requireNumber("coreWebVitals.largestContentfulPaintMs", coreWebVitals.largestContentfulPaintMs);
requireNumber("coreWebVitals.cumulativeLayoutShift", coreWebVitals.cumulativeLayoutShift, (item) => Number.isFinite(item) && item > 0 && item <= 0.1);
requireNumber("coreWebVitals.interactionToNextPaintMs", coreWebVitals.interactionToNextPaintMs);
requireNumber("coreWebVitals.totalBlockingTimeMs", coreWebVitals.totalBlockingTimeMs);
requireNumber("coreWebVitals.firstContentfulPaintMs", coreWebVitals.firstContentfulPaintMs);

requireArray("routeBudgets", routeBudgets, 5);
requireArray("apiLoadTargets", apiLoadTargets, 3);
requireArray("databaseQueryTargets", databaseQueryTargets, 3);
requireArray("imageOptimizationTargets", imageOptimizationTargets, 2);

for (const route of routeBudgets) {
  if (!route.id || !route.url || !["web", "dashboard"].includes(route.surface)) failures.push(`route budget ${route.id ?? "<missing>"} must declare id, url, and web/dashboard surface.`);
  requireNumber(`routeBudgets.${route.id}.lighthousePerformanceMin`, route.lighthousePerformanceMin, (item) => Number.isFinite(item) && item >= 80);
  requireNumber(`routeBudgets.${route.id}.maxJsKb`, route.maxJsKb);
}

for (const target of apiLoadTargets) {
  if (!target.id || !target.method || !target.path) failures.push(`api load target ${target.id ?? "<missing>"} must declare id, method, and path.`);
  requireNumber(`apiLoadTargets.${target.id}.requestsPerSecond`, target.requestsPerSecond);
  requireNumber(`apiLoadTargets.${target.id}.p95Ms`, target.p95Ms);
  requireNumber(`apiLoadTargets.${target.id}.maxErrorRate`, target.maxErrorRate, (item) => Number.isFinite(item) && item >= 0 && item <= 0.05);
  requireArray(`apiLoadTargets.${target.id}.requires`, target.requires, 2);
}

for (const target of databaseQueryTargets) {
  if (!target.id) failures.push("database query target must declare id.");
  requireArray(`databaseQueryTargets.${target.id}.models`, target.models, 1);
  requireNumber(`databaseQueryTargets.${target.id}.maxRowsScanned`, target.maxRowsScanned);
  requireNumber(`databaseQueryTargets.${target.id}.p95Ms`, target.p95Ms);
  requireArray(`databaseQueryTargets.${target.id}.requires`, target.requires, 2);
}

for (const target of imageOptimizationTargets) {
  if (!target.kind) failures.push("image optimization target must declare kind.");
  requireNumber(`imageOptimizationTargets.${target.kind}.maxOriginalMb`, target.maxOriginalMb);
  requireArray(`imageOptimizationTargets.${target.kind}.derivatives`, target.derivatives, 1);
  requireArray(`imageOptimizationTargets.${target.kind}.formats`, target.formats, 1);
  requireNumber(`imageOptimizationTargets.${target.kind}.maxDerivativeKb`, target.maxDerivativeKb);
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  routeBudgetCount: routeBudgets.length,
  apiLoadTargetCount: apiLoadTargets.length,
  databaseQueryTargetCount: databaseQueryTargets.length,
  imageOptimizationTargetCount: imageOptimizationTargets.length
}, null, 2));
