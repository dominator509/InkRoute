import { describe, expect, it } from "vitest";
import {
  evaluateEncryptionPolicy,
  evaluateProviderTokenEncryptionPolicy,
  encryptTextField,
  invalidateEncryptionCache,
  verifyEncryptionRoundTrip,
} from "../src/index";

function withEncryptionEnv(values: {
  primary?: string | undefined;
  secondary?: string | undefined;
  primaryId?: string;
  secondaryId?: string;
}): Record<string, string | undefined> {
  const previous: Record<string, string | undefined> = {
    SECURITY_ENCRYPTION_PRIMARY_KEY: process.env.SECURITY_ENCRYPTION_PRIMARY_KEY,
    SECURITY_ENCRYPTION_SECONDARY_KEY: process.env.SECURITY_ENCRYPTION_SECONDARY_KEY,
    SECURITY_ENCRYPTION_KEY_ID: process.env.SECURITY_ENCRYPTION_KEY_ID,
    SECURITY_ENCRYPTION_SECONDARY_KEY_ID: process.env.SECURITY_ENCRYPTION_SECONDARY_KEY_ID,
  };

  if (values.primary === undefined) {
    delete process.env.SECURITY_ENCRYPTION_PRIMARY_KEY;
  } else {
    process.env.SECURITY_ENCRYPTION_PRIMARY_KEY = values.primary;
  }

  if (values.secondary === undefined) {
    delete process.env.SECURITY_ENCRYPTION_SECONDARY_KEY;
  } else {
    process.env.SECURITY_ENCRYPTION_SECONDARY_KEY = values.secondary;
  }

  if (values.primaryId === undefined) {
    delete process.env.SECURITY_ENCRYPTION_KEY_ID;
  } else {
    process.env.SECURITY_ENCRYPTION_KEY_ID = values.primaryId;
  }

  if (values.secondaryId === undefined) {
    delete process.env.SECURITY_ENCRYPTION_SECONDARY_KEY_ID;
  } else {
    process.env.SECURITY_ENCRYPTION_SECONDARY_KEY_ID = values.secondaryId;
  }

  invalidateEncryptionCache();
  return previous;
}

function restoreEnv(previous: Record<string, string | undefined>) {
  const keys: Array<keyof typeof previous> = [
    "SECURITY_ENCRYPTION_PRIMARY_KEY",
    "SECURITY_ENCRYPTION_SECONDARY_KEY",
    "SECURITY_ENCRYPTION_KEY_ID",
    "SECURITY_ENCRYPTION_SECONDARY_KEY_ID",
  ];
  for (const key of keys) {
    const previousValue = previous[key];
    if (previousValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = previousValue;
    }
  }
  invalidateEncryptionCache();
}

describe("encryption policy and cache-rotation coverage", () => {
  it("denies sensitive DB persistence when encryption keys are missing", async () => {
    const restore = withEncryptionEnv({});
    try {
      const policy = await evaluateEncryptionPolicy({
        operation: "booking-request:create",
        scope: "database",
        requiredFields: ["medicalNotesEncrypted"],
      });

      expect(policy.status).toBe("deny");
      expect(policy.canPersist).toBe(false);
      expect(policy.readiness.ready).toBe(false);
      expect(policy.readiness.status).toBe("not_configured");
    } finally {
      restoreEnv(restore);
    }
  });

  it("supports local-fallback persistence policy as warning when keys are missing", async () => {
    const restore = withEncryptionEnv({});
    try {
      const localFallback = await evaluateEncryptionPolicy({
        operation: "booking-request:create",
        scope: "local-fallback",
        requiredFields: ["medicalNotesEncrypted"],
      });

      expect(localFallback.status).toBe("warn");
      expect(localFallback.canPersist).toBe(true);
      expect(localFallback.readiness.ready).toBe(false);
      expect(localFallback.readiness.status).toBe("not_configured");
    } finally {
      restoreEnv(restore);
    }
  });

  it("reads provider-token policy and secondary-only key setups for explicit token fields", async () => {
    const restore = withEncryptionEnv({ secondary: "b".repeat(64), primaryId: "primary-key", secondaryId: "secondary-key" });
    try {
      const policy = await evaluateProviderTokenEncryptionPolicy("database");
      expect(policy.status).toBe("allow");
      expect(policy.readiness.ready).toBe(true);
      expect(policy.rotation.hasPrimary).toBe(false);
      expect(policy.rotation.hasSecondary).toBe(true);
      expect(policy.rotation.rotationState).toBe("single_secondary_only");
    } finally {
      restoreEnv(restore);
    }
  });

  it("reports dual-key rotation metadata when both primary and secondary keys are configured", async () => {
    const restore = withEncryptionEnv({
      primary: "a".repeat(64),
      secondary: "b".repeat(64),
      primaryId: "k-1",
      secondaryId: "k-2",
    });

    try {
      const policy = await evaluateEncryptionPolicy({
        operation: "booking-request:create",
        scope: "database",
        requiredFields: ["medicalNotesEncrypted"],
      });

      expect(policy.status).toBe("allow");
      expect(policy.rotation.hasPrimary).toBe(true);
      expect(policy.rotation.hasSecondary).toBe(true);
      expect(policy.rotation.rotationState).toBe("dual_key_rotation_ready");
      expect(policy.readiness.ready).toBe(true);
    } finally {
      restoreEnv(restore);
    }
  });

  it("refreshes cache-version metadata after cache invalidation", async () => {
    const restore = withEncryptionEnv({
      primary: "c".repeat(64),
      secondary: "d".repeat(64),
      primaryId: "k-1",
      secondaryId: "k-2",
    });

    try {
      const first = await evaluateEncryptionPolicy({
        operation: "booking-request:create",
        scope: "database",
        requiredFields: ["medicalNotesEncrypted"],
      });
      const before = first.rotation.cacheVersion;
      const after = invalidateEncryptionCache();
      const refreshed = await evaluateEncryptionPolicy({
        operation: "booking-request:create",
        scope: "database",
        requiredFields: ["medicalNotesEncrypted"],
      });

      expect(after).toBeGreaterThan(before);
      expect(refreshed.rotation.cacheVersion).toBe(after);
      expect(refreshed.rotation.rotationState).toBe("dual_key_rotation_ready");
    } finally {
      restoreEnv(restore);
    }
  });

  it("returns redacted ciphertext artifacts for disabled-key fallback and fails round-trip proof", async () => {
    const restore = withEncryptionEnv({});
    try {
      const attempt = await encryptTextField("sensitive medical note");
      const roundTrip = await verifyEncryptionRoundTrip("sensitive medical note", attempt.encryptedValue);

      expect(attempt.status).toBe("redacted");
      expect(attempt.encryptedValue).toBeNull();
      expect(roundTrip.ok).toBe(false);
      expect(roundTrip.reason).toBe("No encrypted value was supplied for verification.");
    } finally {
      restoreEnv(restore);
    }
  });
});
