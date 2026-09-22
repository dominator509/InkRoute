/**
 * Typed mutation of `process.env.NODE_ENV` for route tests.
 *
 * `@types/node` declares `process.env.NODE_ENV` as read-only, so direct
 * assignment (`process.env.NODE_ENV = "production"`) fails typecheck. Tests
 * that must exercise production-only behavior use this helper instead:
 *
 *   const originalNodeEnv = process.env.NODE_ENV; // read stays as-is
 *   setNodeEnv("production");
 *   ...
 *   setNodeEnv(originalNodeEnv); // restore
 */
export function setNodeEnv(value: string | undefined): void {
  (process.env as unknown as Record<string, string | undefined>).NODE_ENV = value;
}
