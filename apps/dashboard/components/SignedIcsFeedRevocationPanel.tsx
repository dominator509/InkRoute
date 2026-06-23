"use client";

import { useMemo, useState } from "react";
import { inkrouteDemoArtist, inkrouteDemoTenant } from "@inkroute/config";

type RevocationState =
  | { status: "idle"; message: string }
  | { status: "ready"; message: string; payload: Record<string, string> };

export function SignedIcsFeedRevocationPanel() {
  const [tokenHash, setTokenHash] = useState("draft_hash_00000000");
  const [state, setState] = useState<RevocationState>({
    status: "idle",
    message: "Enter an already-hashed signed-feed token. Raw feed tokens must never be pasted into dashboard evidence.",
  });

  const revocationPayload = useMemo(
    () => ({
      tenantSlug: inkrouteDemoTenant.slug,
      artistSlug: inkrouteDemoArtist.slug,
      tokenHash: tokenHash.trim(),
      revokedAt: new Date().toISOString(),
      actorId: "dashboard-calendar-operator",
    }),
    [tokenHash],
  );

  function planRevocation() {
    const normalized = tokenHash.trim();
    if (!normalized.startsWith("draft_hash_")) {
      setState({
        status: "idle",
        message: "Blocked: revocation UI only accepts hash-shaped signed-feed identifiers, never raw feed tokens.",
      });
      return;
    }

    setState({
      status: "ready",
      message:
        "Revocation request payload is ready for the provider-backed API proof path; durable DB execution and revoked-route tests remain gated.",
      payload: revocationPayload,
    });
  }

  return (
    <section className="card action-panel">
      <div>
        <p className="eyebrow">Signed ICS controls</p>
        <h2>Revoke signed feed token</h2>
        <p>
          This local dashboard surface plans hash-only signed-feed revocation without storing raw tokens. Durable token
          lookup, revoked-token route rejection, calendar-client import smoke, and retained redacted artifacts remain
          evidence-gated.
        </p>
      </div>
      <label className="form-field">
        <span>Signed-feed token hash</span>
        <input
          value={tokenHash}
          onChange={(event) => setTokenHash(event.target.value)}
          placeholder="draft_hash_..."
          aria-describedby="signed-ics-revocation-boundary"
        />
      </label>
      <div className="button-row">
        <button type="button" onClick={planRevocation}>
          Plan revocation payload
        </button>
        <button type="button" disabled>
          Execute after DB proof
        </button>
      </div>
      <p id="signed-ics-revocation-boundary" className={`form-boundary-note ${state.status === "ready" ? "success" : ""}`}>
        {state.message}
      </p>
      {state.status === "ready" ? <pre className="code-preview">{JSON.stringify(state.payload, null, 2)}</pre> : null}
    </section>
  );
}
