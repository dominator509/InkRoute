"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  bookingFlowSteps,
  calculateTattooReadinessScore,
  emptyBookingDraft,
  getTravelBookingCta,
  type BookingDraft,
  type BookingDraftReferenceImage,
  type BookingFlowStep,
  type BookingFlowStepId,
} from "@inkroute/booking";
import {
  bookingBudgetRanges,
  bookingDateWindows,
  bookingIntegrationBoundaries,
  bookingPlacementOptions,
  bookingPolicyAcknowledgements,
  bookingStyleOptions,
  demoPortfolioItems,
  demoTravelStops,
  inkrouteDemoArtist,
  inkrouteDemoTenant,
} from "@inkroute/config";
import type { BodyPlacement, TattooStyle } from "@inkroute/types";
import { formatDateRange } from "../../lib/format";

const stepOrder = bookingFlowSteps.map((step) => step.id);
const finalStepId: BookingFlowStepId = "confirmation";

type BookingSubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "submitted"; bookingRequestId: string; source: string }
  | { status: "failed"; message: string };

function clampStep(index: number) {
  return Math.max(0, Math.min(index, bookingFlowSteps.length - 1));
}

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BookingFlowClient() {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<BookingDraft>(emptyBookingDraft);
  const [previewSubmitted, setPreviewSubmitted] = useState(false);
  const [submitState, setSubmitState] = useState<BookingSubmitState>({ status: "idle" });

  const activeStep = (bookingFlowSteps[clampStep(stepIndex)] as BookingFlowStep) ?? bookingFlowSteps[0];
  const readiness = useMemo(() => calculateTattooReadinessScore(draft), [draft]);
  const selectedTravelStop = demoTravelStops.find((stop) => stop.id === draft.preferredCitySlug);
  const selectedPortfolio = demoPortfolioItems.find((item) => item.attributionKey === draft.portfolioAttributionId);

  const setField = <K extends keyof BookingDraft>(key: K, value: BookingDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setPreviewSubmitted(false);
    setSubmitState({ status: "idle" });
  };

  const goToStep = (nextIndex: number) => setStepIndex(clampStep(nextIndex));

  const handleReferenceFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const localOnlyFiles: BookingDraftReferenceImage[] = files.slice(0, 5).map((file, index) => ({
      localId: `local_reference_${Date.now()}_${index}`,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      uploadStatus: "local_only",
    }));
    setField("referenceImages", localOnlyFiles);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeStep.id !== finalStepId || submitState.status === "submitting") return;

    setSubmitState({ status: "submitting" });
    let response: Response;
    let payload: { data?: { bookingRequest?: { id?: string }; source?: string }; error?: { message?: string } } | null = null;
    try {
      response = await fetch(`/api/public/${inkrouteDemoTenant.slug}/booking-requests`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          artistId: inkrouteDemoArtist.id,
          travelCityId: selectedTravelStop?.id,
          clientName: draft.clientName,
          clientEmail: draft.clientEmail,
          clientPhone: draft.clientPhone || undefined,
          preferredCity: selectedTravelStop ? `${selectedTravelStop.city}, ${selectedTravelStop.region}` : draft.preferredCitySlug,
          preferredDate: selectedTravelStop?.startsAt,
          style: draft.style,
          placement: draft.placement,
          sizeEstimate: draft.sizeEstimate,
          ideaSummary: draft.ideaSummary,
          medicalNotes: draft.medicalNotes || undefined,
          policyAccepted: draft.policyAccepted && draft.ageAcknowledged && draft.privacyAcknowledged && draft.depositBoundaryAcknowledged,
          portfolioAttributionId: draft.portfolioAttributionId,
          utmSource: "booking-flow-client",
          utmMedium: "web",
          utmCampaign: "phase-4-runtime",
        }),
      });
      payload = await response.json().catch(() => null) as { data?: { bookingRequest?: { id?: string }; source?: string }; error?: { message?: string } } | null;
    } catch {
      setSubmitState({ status: "failed", message: "Booking request submission could not reach the tenant API runtime." });
      return;
    }

    if (!response.ok) {
      setSubmitState({ status: "failed", message: payload?.error?.message ?? "Booking request submission failed validation or persistence." });
      return;
    }

    setSubmitState({
      status: "submitted",
      bookingRequestId: payload?.data?.bookingRequest?.id ?? "pending",
      source: payload?.data?.source ?? "unknown",
    });
  };

  const renderStep = () => {
    if (activeStep.id === "city") {
      return (
        <div className="booking-step-panel">
          <div className="field-grid">
            <label>
              Preferred city / travel stop
              <select value={draft.preferredCitySlug} onChange={(event) => setField("preferredCitySlug", event.target.value)}>
                <option value="">Choose a city</option>
                {demoTravelStops.map((stop) => (
                  <option value={stop.id} key={stop.id}>
                    {stop.city}, {stop.region} — {stop.bookingStatus}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date window
              <select value={draft.preferredDateWindow} onChange={(event) => setField("preferredDateWindow", event.target.value)}>
                <option value="">Choose timing</option>
                {bookingDateWindows.map((window) => (
                  <option value={window} key={window}>{window}</option>
                ))}
              </select>
            </label>
          </div>
          {selectedTravelStop ? (
            <div className="booking-highlight-card">
              <p className="eyebrow">{getTravelBookingCta(selectedTravelStop.bookingStatus)}</p>
              <h3>{selectedTravelStop.city}, {selectedTravelStop.region}</h3>
              <p>{formatDateRange(selectedTravelStop.startsAt, selectedTravelStop.endsAt, selectedTravelStop.timezone)} · {selectedTravelStop.studioName}</p>
              <p>{selectedTravelStop.publicNotes}</p>
            </div>
          ) : null}
          <label>
            Location or accessibility notes
            <textarea
              value={draft.locationPreference}
              onChange={(event) => setField("locationPreference", event.target.value)}
              placeholder="Studio preference, travel constraints, accessibility needs, or waitlist context."
            />
          </label>
        </div>
      );
    }

    if (activeStep.id === "concept") {
      return (
        <div className="booking-step-panel">
          <div className="field-grid">
            <label>
              Style direction
              <select value={draft.style} onChange={(event) => setField("style", event.target.value as TattooStyle | "")}>
                <option value="">Choose a style</option>
                {bookingStyleOptions.map((style) => (
                  <option value={style.value} key={style.value}>{style.label}</option>
                ))}
              </select>
            </label>
            <label>
              Body placement
              <select value={draft.placement} onChange={(event) => setField("placement", event.target.value as BodyPlacement | "")}>
                <option value="">Choose placement</option>
                {bookingPlacementOptions.map((placement) => (
                  <option value={placement.value} key={placement.value}>{placement.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="field-grid">
            <label>
              Approximate size
              <input
                value={draft.sizeEstimate}
                onChange={(event) => setField("sizeEstimate", event.target.value)}
                placeholder="Palm-sized, 4 inches, half sleeve, full back..."
              />
            </label>
            <label>
              Budget range
              <select value={draft.budgetRange} onChange={(event) => setField("budgetRange", event.target.value)}>
                <option value="">Choose budget range</option>
                {bookingBudgetRanges.map((range) => (
                  <option value={range} key={range}>{range}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Tattoo idea
            <textarea
              value={draft.ideaSummary}
              onChange={(event) => setField("ideaSummary", event.target.value)}
              placeholder="Describe the concept, mood, references, symbolism, placement constraints, and anything you do not want."
            />
          </label>
          <label>
            Portfolio inspiration
            <select value={draft.portfolioAttributionId ?? ""} onChange={(event) => setField("portfolioAttributionId", event.target.value || undefined)}>
              <option value="">No specific portfolio piece</option>
              {demoPortfolioItems.map((item) => (
                <option value={item.attributionKey ?? item.id} key={item.id}>{item.title} · {item.city}</option>
              ))}
            </select>
          </label>
          <label>
            Reference images, local metadata
            <input type="file" accept="image/*" multiple onChange={handleReferenceFiles} />
          </label>
          <div className="form-boundary-note">
            <strong>Upload boundary:</strong> files selected here stay as local metadata in this booking form. The secure-upload intent route and local validation controls are wired, while provider-backed signed private uploads, file scanning, and storage access proof remain evidence-gated.
          </div>
          {draft.referenceImages.length > 0 ? (
            <ul className="booking-file-list" aria-label="Selected local reference image metadata">
              {draft.referenceImages.map((file) => (
                <li key={file.localId}>{file.filename} · {file.mimeType} · {formatBytes(file.sizeBytes)} · local only</li>
              ))}
            </ul>
          ) : null}
          {selectedPortfolio ? <p className="muted">Portfolio attribution preview: {selectedPortfolio.title} helped shape this request.</p> : null}
        </div>
      );
    }

    if (activeStep.id === "client") {
      return (
        <div className="booking-step-panel">
          <div className="field-grid">
            <label>
              Preferred name
              <input value={draft.clientName} onChange={(event) => setField("clientName", event.target.value)} placeholder="Your name" />
            </label>
            <label>
              Email
              <input value={draft.clientEmail} onChange={(event) => setField("clientEmail", event.target.value)} placeholder="you@example.com" inputMode="email" />
            </label>
          </div>
          <label>
            Phone, optional
            <input value={draft.clientPhone} onChange={(event) => setField("clientPhone", event.target.value)} placeholder="For SMS only after consent and provider setup" inputMode="tel" />
          </label>
          <label>
            Medical, skin, or accessibility notes, optional
            <textarea
              value={draft.medicalNotes}
              onChange={(event) => setField("medicalNotes", event.target.value)}
              placeholder="Sensitive notes are encrypted for persisted DB writes and redacted in local fallback. Avoid real medical data until production proof is captured."
            />
          </label>
          <div className="booking-checkbox-grid">
            <label className="checkbox-card">
              <input type="checkbox" checked={draft.marketingOptIn} onChange={(event) => setField("marketingOptIn", event.target.checked)} />
              Send me guest spot, flash drop, and city waitlist updates.
            </label>
            <label className="checkbox-card">
              <input type="checkbox" checked={draft.smsOptIn} onChange={(event) => setField("smsOptIn", event.target.checked)} />
              I may want SMS updates after compliance language and provider setup are live.
            </label>
          </div>
        </div>
      );
    }

    if (activeStep.id === "policies") {
      return (
        <div className="booking-step-panel">
          <div className="booking-boundary-grid">
            {bookingIntegrationBoundaries.map((boundary) => (
              <article className="panel-card compact-card" key={boundary.label}>
                <p className="eyebrow">{boundary.status}</p>
                <h3>{boundary.label}</h3>
                <p>{boundary.detail}</p>
              </article>
            ))}
          </div>
          <div className="booking-checkbox-grid single">
            {bookingPolicyAcknowledgements.map((acknowledgement) => (
              <label className="checkbox-card" key={acknowledgement.id}>
                <input
                  type="checkbox"
                  checked={Boolean(draft[acknowledgement.id])}
                  onChange={(event) => setField(acknowledgement.id, event.target.checked)}
                />
                {acknowledgement.label}
              </label>
            ))}
          </div>
          <div className="form-boundary-note">
            <strong>Legal boundary:</strong> these acknowledgements are demo product copy, not attorney-approved consent, medical, privacy, SMS, cancellation, or no-show policy language.
          </div>
        </div>
      );
    }

    return (
      <div className="booking-step-panel confirmation-panel">
        <div className="booking-highlight-card strong">
          <p className="eyebrow">Confirmation preview</p>
          <h3>{previewSubmitted ? "Preview generated" : "Ready for API-backed submission"}</h3>
          <p>The final submit posts the intake JSON to the tenant-scoped booking API. Reference files remain local metadata only, and provider uploads, messages, calendar holds, deposits, and payments remain blocked behind their evidence gates.</p>
        </div>
        <dl className="booking-summary-list">
          <div><dt>City</dt><dd>{selectedTravelStop ? `${selectedTravelStop.city}, ${selectedTravelStop.region}` : "Not selected"}</dd></div>
          <div><dt>Date window</dt><dd>{draft.preferredDateWindow || "Not selected"}</dd></div>
          <div><dt>Style</dt><dd>{draft.style || "Not selected"}</dd></div>
          <div><dt>Placement / size</dt><dd>{draft.placement || "Not selected"} · {draft.sizeEstimate || "No size yet"}</dd></div>
          <div><dt>Budget</dt><dd>{draft.budgetRange || "Not selected"}</dd></div>
          <div><dt>References</dt><dd>{draft.referenceImages.length} local file metadata record(s)</dd></div>
          <div><dt>Client</dt><dd>{draft.clientName || "No name"} · {draft.clientEmail || "No email"}</dd></div>
          <div><dt>Readiness</dt><dd>{readiness.percentage}% · {readiness.label}</dd></div>
        </dl>
        <button className="button" type="button" onClick={() => setPreviewSubmitted(true)}>Generate confirmation preview</button>
        {submitState.status === "submitted" ? (
          <div className="form-boundary-note success">
            <strong>Booking request submitted:</strong> {submitState.bookingRequestId} via {submitState.source}. Provider handoffs remain evidence-gated.
          </div>
        ) : null}
        {submitState.status === "failed" ? (
          <div className="form-boundary-note danger">
            <strong>Submission blocked:</strong> {submitState.message}
          </div>
        ) : null}
        {previewSubmitted ? (
          <div className="booking-next-steps">
            <h4>What the real confirmation should do later</h4>
            <ol>
              <li>Create a tenant-scoped booking request row and booking state event.</li>
              <li>Persist private reference images through signed uploads.</li>
              <li>Notify the artist and send the client a confirmation email.</li>
              <li>Offer Stripe deposit checkout only after artist acceptance or policy rule match.</li>
              <li>Expose booking timeline in dashboard and mobile.</li>
            </ol>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="booking-workspace">
      <aside className="booking-progress-panel" aria-label="Booking request progress">
        <p className="eyebrow">Tattoo Readiness Score</p>
        <div className="readiness-meter" aria-label={`Readiness score ${readiness.percentage}%`}>
          <span style={{ width: `${readiness.percentage}%` }} />
        </div>
        <h2>{readiness.percentage}%</h2>
        <p>{readiness.label}. This score is calculated locally from request completeness and is not saved.</p>
        <ol className="booking-step-list">
          {bookingFlowSteps.map((step, index) => (
            <li key={step.id} className={index === stepIndex ? "active" : index < stepIndex ? "complete" : ""}>
              <button type="button" onClick={() => goToStep(index)}>
                <span>{step.eyebrow}</span>
                {step.title}
              </button>
            </li>
          ))}
        </ol>
        <div className="readiness-checks">
          {readiness.checks.map((check) => (
            <div className={check.passed ? "passed" : ""} key={check.id}>
              <span aria-hidden="true">{check.passed ? "✓" : "•"}</span>
              <p><strong>{check.label}</strong><br />{check.passed ? `${check.points} points captured` : check.message}</p>
            </div>
          ))}
        </div>
      </aside>

      <section className="booking-form-panel" aria-labelledby="booking-step-title">
        <p className="eyebrow">{activeStep.eyebrow}</p>
        <h2 id="booking-step-title">{activeStep.title}</h2>
        <p>{activeStep.summary}</p>
        <div className="booking-required-fields">
          {activeStep.requiredFields.length > 0 ? `Required now: ${activeStep.requiredFields.join(", ")}` : "No additional fields required on this preview step."}
        </div>
        <form className="demo-form booking-form live-preview" onSubmit={handleSubmit}>
          {renderStep()}
          <div className="booking-nav-actions">
            <button className="button secondary" type="button" onClick={() => goToStep(stepIndex - 1)} disabled={stepIndex === 0}>Back</button>
            {activeStep.id === finalStepId ? (
              <>
                <button className="button" type="submit" disabled={submitState.status === "submitting"}>
                  {submitState.status === "submitting" ? "Submitting..." : "Submit booking request"}
                </button>
                <a className="button secondary" href="/booking/confirmation">Open static confirmation page</a>
              </>
            ) : (
              <button className="button" type="button" onClick={() => goToStep(stepIndex + 1)}>Continue</button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

