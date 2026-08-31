export function createClientRequestKey(scope: string): string {
  const random = globalThis.crypto?.randomUUID?.();
  if (!random) {
    throw new Error("Secure browser UUID generation is unavailable for dashboard request keys.");
  }
  return `${scope}:${random}`;
}
