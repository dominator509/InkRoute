import { buildStripeCheckoutRouteRuntimeReadinessPlan } from "@inkroute/payments";

export type StripeCheckoutRuntimeStatus =
  | "wired"
  | "sdk-gated"
  | "auth-gated"
  | "persistence-gated"
  | "audit-gated"
  | "webhook-gated"
  | "provider-gated"
  | "ci-gated";

export interface StripeCheckoutRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: StripeCheckoutRuntimeStatus;
}

export const stripeCheckoutRuntimeCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm test:unit -- apps/web/tests/payment-routes.test.ts",
  "capture installed Stripe SDK/API-version source contract and redacted secret evidence",
  "configure STRIPE_SECRET_KEY in secret store",
  "enforce accepted booking or short-lived signed deposit token",
  "persist idempotency key before calling Stripe Checkout",
  "persist Stripe Checkout session id and redirect URL after provider creation",
  "persist PaymentAuditLog for Checkout attempts and outcomes",
  "wrap Deposit, Payment, PaymentAuditLog, and IdempotencyKey writes in one tenant-scoped transaction",
  "enforce success/cancel redirect host allowlist at route boundary",
  "return only Stripe-hosted redirect URL and redacted local ids to browser",
  "test invalid and expired signed deposit token rejection",
  "stripe checkout session create test-mode smoke",
  "stripe trigger checkout.session.completed",
  "GitHub Actions Stripe Checkout evidence job",
] as const;

export const stripeCheckoutArtifactPaths = [
  "coverage/stripe-checkout-runtime.json",
  "coverage/stripe-checkout-payments-typecheck.txt",
  "coverage/stripe-checkout-payments-test.txt",
  "coverage/stripe-checkout-web-typecheck.txt",
  "coverage/stripe-checkout-route-tests.json",
  "coverage/stripe-checkout-sdk-config-redacted.json",
  "coverage/stripe-checkout-secret-store-redacted.json",
  "coverage/stripe-checkout-api-version.json",
  "coverage/stripe-checkout-signed-token-auth.json",
  "coverage/stripe-checkout-idempotency-before-provider.json",
  "coverage/stripe-checkout-provider-session-persistence.json",
  "coverage/stripe-checkout-payment-audit-log.json",
  "coverage/stripe-checkout-tenant-transaction.json",
  "coverage/stripe-checkout-redirect-allowlist.json",
  "coverage/stripe-checkout-safe-browser-response.json",
  "coverage/stripe-checkout-invalid-expired-token.json",
  "coverage/stripe-checkout-webhook-reconciliation.json",
  "coverage/stripe-checkout-test-mode-provider-redacted.json",
  "coverage/stripe-checkout-secret-safe-artifacts.json",
  "test-results/stripe-checkout-runtime",
] as const;

export const stripeCheckoutRuntimeProofFiles = [
  "packages/payments/package.json",
  "pnpm-lock.yaml",
  "packages/payments/src/index.ts",
  "packages/payments/tests/deposit-policy.test.ts",
  "apps/web/lib/stripeCheckout.ts",
  "apps/web/lib/stripeCheckoutRuntime.ts",
  "apps/web/app/api/public/[tenantSlug]/deposit-sessions/route.ts",
  "apps/web/tests/payment-routes.test.ts",
  "apps/web/tests/stripe-checkout-static.test.ts",
  "apps/web/tests/stripe-checkout-runtime-static.test.ts",
  "apps/web/package.json",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export const stripeCheckoutEvidenceFlags = [
  "paymentsTypecheckPassed",
  "paymentsTestsPassed",
  "webTypecheckPassed",
  "paymentRouteTestsPassed",
  "stripeSdkInstalled",
  "stripeSecretConfigured",
  "stripeApiVersionPinned",
  "signedTokenAuthVerified",
  "idempotencyBeforeProviderVerified",
  "providerSessionPersistenceVerified",
  "paymentAuditLogPersisted",
  "tenantTransactionVerified",
  "redirectAllowlistVerified",
  "safeBrowserResponseVerified",
  "invalidExpiredTokenRejected",
  "webhookReconciliationVerified",
  "stripeTestModeCheckoutVerified",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type StripeCheckoutEvidenceFlag = (typeof stripeCheckoutEvidenceFlags)[number];

export interface StripeCheckoutExecutionPolicy {
  readonly codexMayClassifyStaticStripeCheckoutReadiness: true;
  readonly stripeSecretRequiredForClosure: true;
  readonly providerCheckoutRequiredForClosure: true;
  readonly providerBackedTransactionRequiredForClosure: true;
  readonly webhookReconciliationRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface StripeCheckoutExecutionPlan {
  readonly policy: typeof stripeCheckoutExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly stripeProviderExecutionAllowed: false;
  readonly secretStoreExecutionAllowed: false;
  readonly databaseTransactionExecutionAllowed: false;
  readonly webhookExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly localCommands: typeof stripeCheckoutLocalCommands;
  readonly externalCommands: typeof stripeCheckoutExternalCommands;
  readonly requiredExternalEvidence: typeof stripeCheckoutRequiredExternalEvidence;
}

export interface StripeCheckoutArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
  readonly requiredExternalEvidence: typeof stripeCheckoutRequiredExternalEvidence;
}

export interface StripeCheckoutEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<StripeCheckoutEvidenceFlag, boolean>>;
}

export interface StripeCheckoutEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly requiredCommands: typeof stripeCheckoutRuntimeCommands;
  readonly missingCommands: readonly string[];
  readonly requiredArtifacts: typeof stripeCheckoutArtifactPaths;
  readonly missingArtifacts: readonly string[];
  readonly requiredEvidence: typeof stripeCheckoutEvidenceFlags;
  readonly missingEvidence: readonly StripeCheckoutEvidenceFlag[];
  readonly blockers: readonly string[];
}

export const stripeCheckoutExecutionPolicy = {
  codexMayClassifyStaticStripeCheckoutReadiness: true,
  stripeSecretRequiredForClosure: true,
  providerCheckoutRequiredForClosure: true,
  providerBackedTransactionRequiredForClosure: true,
  webhookReconciliationRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies StripeCheckoutExecutionPolicy;

export const stripeCheckoutRequiredExternalEvidence = [
  "STRIPE_SECRET_KEY secret-store configuration evidence",
  "installed Stripe SDK/API-version source contract",
  "provider-backed DB idempotency/persistence execution proof",
  "Stripe test-mode Checkout provider transcript",
  "webhook reconciliation proof",
  "web typecheck output",
  "CI Stripe Checkout evidence",
  "secret-safe Stripe Checkout artifact review",
] as const;

export const stripeCheckoutRuntimeMatrix = [
  {
    id: "payments-typecheck",
    command: "pnpm --filter @inkroute/payments typecheck",
    artifact: "coverage/stripe-checkout-payments-typecheck.txt",
    status: "wired",
  },
  {
    id: "payments-tests",
    command: "pnpm --filter @inkroute/payments test",
    artifact: "coverage/stripe-checkout-payments-test.txt",
    status: "wired",
  },
  {
    id: "web-typecheck",
    command: "pnpm --filter @inkroute/web typecheck",
    artifact: "coverage/stripe-checkout-web-typecheck.txt",
    status: "ci-gated",
  },
  {
    id: "payment-route-tests",
    command: "pnpm test:unit -- apps/web/tests/payment-routes.test.ts",
    artifact: "coverage/stripe-checkout-route-tests.json",
    status: "ci-gated",
  },
  {
    id: "stripe-sdk-config",
    command: "capture installed Stripe SDK/API-version source contract and redacted secret evidence",
    artifact: "coverage/stripe-checkout-sdk-config-redacted.json",
    status: "sdk-gated",
  },
  {
    id: "secret-store-config",
    command: "configure STRIPE_SECRET_KEY in secret store",
    artifact: "coverage/stripe-checkout-secret-store-redacted.json",
    status: "sdk-gated",
  },
  {
    id: "signed-token-auth",
    command: "enforce accepted booking or short-lived signed deposit token",
    artifact: "coverage/stripe-checkout-signed-token-auth.json",
    status: "auth-gated",
  },
  {
    id: "idempotency-before-provider",
    command: "persist idempotency key before calling Stripe Checkout",
    artifact: "coverage/stripe-checkout-idempotency-before-provider.json",
    status: "persistence-gated",
  },
  {
    id: "provider-session-persistence",
    command: "persist Stripe Checkout session id and redirect URL after provider creation",
    artifact: "coverage/stripe-checkout-provider-session-persistence.json",
    status: "persistence-gated",
  },
  {
    id: "payment-audit-log",
    command: "persist PaymentAuditLog for Checkout attempts and outcomes",
    artifact: "coverage/stripe-checkout-payment-audit-log.json",
    status: "audit-gated",
  },
  {
    id: "tenant-transaction",
    command: "wrap Deposit, Payment, PaymentAuditLog, and IdempotencyKey writes in one tenant-scoped transaction",
    artifact: "coverage/stripe-checkout-tenant-transaction.json",
    status: "persistence-gated",
  },
  {
    id: "redirect-allowlist",
    command: "enforce success/cancel redirect host allowlist at route boundary",
    artifact: "coverage/stripe-checkout-redirect-allowlist.json",
    status: "wired",
  },
  {
    id: "safe-browser-response",
    command: "return only Stripe-hosted redirect URL and redacted local ids to browser",
    artifact: "coverage/stripe-checkout-safe-browser-response.json",
    status: "wired",
  },
  {
    id: "invalid-expired-token-tests",
    command: "test invalid and expired signed deposit token rejection",
    artifact: "coverage/stripe-checkout-invalid-expired-token.json",
    status: "auth-gated",
  },
  {
    id: "webhook-reconciliation",
    command: "stripe trigger checkout.session.completed",
    artifact: "coverage/stripe-checkout-webhook-reconciliation.json",
    status: "webhook-gated",
  },
  {
    id: "test-mode-provider-smoke",
    command: "stripe checkout session create test-mode smoke",
    artifact: "coverage/stripe-checkout-test-mode-provider-redacted.json",
    status: "provider-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions Stripe Checkout evidence job",
    artifact: "coverage/stripe-checkout-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly StripeCheckoutRuntimeMatrixEntry[];

const stripeCheckoutPackageReadiness = buildStripeCheckoutRouteRuntimeReadinessPlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  paymentsTestsPassed: false,
  paymentsTypecheckPassed: false,
  webPaymentRouteTestsPassed: false,
  webTypecheckPassed: false,
  stripeSdkInstalled: true,
  stripeSecretConfigured: false,
  stripeApiVersionPinned: true,
  checkoutRouteUsesStripeClient: true,
  acceptedBookingOrSignedTokenEnforced: true,
  idempotencyKeyPersistedBeforeProviderCall: true,
  providerSessionPersisted: true,
  paymentAuditLogPersisted: true,
  tenantScopedTransactionConfigured: true,
  allowedRedirectHostsEnforced: true,
  safeBrowserResponseVerified: true,
  invalidTokenRejectedTested: true,
  expiredTokenRejectedTested: true,
  webhookReconciliationVerified: false,
  stripeTestModeCheckoutVerified: false,
});

export const stripeCheckoutRuntimeReadiness = {
  ...stripeCheckoutPackageReadiness,
  requiredCommands: stripeCheckoutRuntimeCommands,
} as const;

export const stripeCheckoutRouteRuntimeRequiredEvidence =
  stripeCheckoutRuntimeReadiness.requiredEvidence;

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) => {
  const actualSet = new Set(actual ?? []);
  return required.filter((entry) => !actualSet.has(entry));
};

const sensitiveStripeCheckoutArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|stripe|checkout|payment|deposit|idempotency|webhook|audit|redirect|email|phone|medical|payment|card|customer)/i;

const redactStripeCheckoutArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactStripeCheckoutArtifactValue(entry, `${path}.${index}`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveStripeCheckoutArtifactKey.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, redactStripeCheckoutArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  return value;
};

export const stripeCheckoutLocalCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "static Stripe Checkout route adapter review",
  "static signed-token authorization and safe browser response review",
] as const;

export const stripeCheckoutExternalCommands = [
  "pnpm --filter @inkroute/web typecheck",
  "pnpm test:unit -- apps/web/tests/payment-routes.test.ts",
  "configure STRIPE_SECRET_KEY in secret store",
  "provider-backed tenant-scoped Checkout transaction execution",
  "stripe checkout session create test-mode smoke",
  "stripe trigger checkout.session.completed",
  "GitHub Actions Stripe Checkout evidence job",
] as const;

export const buildStripeCheckoutExecutionPlan = (): StripeCheckoutExecutionPlan => ({
  policy: stripeCheckoutExecutionPolicy,
  commandExecutionAllowed: false,
  stripeProviderExecutionAllowed: false,
  secretStoreExecutionAllowed: false,
  databaseTransactionExecutionAllowed: false,
  webhookExecutionAllowed: false,
  ciExecutionAllowed: false,
  localCommands: stripeCheckoutLocalCommands,
  externalCommands: stripeCheckoutExternalCommands,
  requiredExternalEvidence: stripeCheckoutRequiredExternalEvidence,
});

export const buildRedactedStripeCheckoutArtifact = (artifact: unknown): Pick<StripeCheckoutArtifactReview, "redactedArtifact" | "redactedPaths"> => {
  const redactedPaths: string[] = [];
  return {
    redactedArtifact: redactStripeCheckoutArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
  };
};

export const buildStripeCheckoutArtifactReview = (artifact: unknown): StripeCheckoutArtifactReview => {
  const redacted = buildRedactedStripeCheckoutArtifact(artifact);
  return {
    artifact,
    redactedArtifact: redacted.redactedArtifact,
    redactedPaths: redacted.redactedPaths,
    secretSafe: redacted.redactedPaths.length > 0,
    requiredExternalEvidence: stripeCheckoutRequiredExternalEvidence,
  };
};

export const buildStripeCheckoutEvidenceDecision = (
  input: StripeCheckoutEvidenceInput = {},
): StripeCheckoutEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, stripeCheckoutRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, stripeCheckoutArtifactPaths);
  const missingEvidence = stripeCheckoutEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = [
    missingCommands.length > 0 ? "Pinned Stripe Checkout commands must be run and captured." : "",
    missingArtifacts.length > 0
      ? "Stripe Checkout artifacts must be retained with SDK, secret, auth, persistence, webhook, provider, CI, and secret-safe evidence."
      : "",
    missingEvidence.length > 0
      ? "Stripe SDK/config, authorization, idempotency, persistence, audit, webhook, provider, CI, and secret-safe evidence must pass."
      : "",
  ].filter(Boolean);

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    requiredCommands: stripeCheckoutRuntimeCommands,
    missingCommands,
    requiredArtifacts: stripeCheckoutArtifactPaths,
    missingArtifacts,
    requiredEvidence: stripeCheckoutEvidenceFlags,
    missingEvidence,
    blockers,
  };
};



