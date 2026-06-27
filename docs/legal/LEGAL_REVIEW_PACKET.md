# InkRoute Legal Review Packet

This packet is a product/legal handoff scaffold, not legal advice and not attorney approval.

## Review scope

Before production launch, qualified counsel must review and approve the customer-facing and operational language for:

- Privacy policy and privacy request workflow.
- Terms of service and SaaS subscription terms.
- Tattoo consent forms and consent signature retention.
- Medical and safety acknowledgments.
- Deposit, cancellation, no-show, refund, tax, and payment language.
- SMS consent, STOP/HELP, quiet-hour, and notification language.
- Aftercare and medical-adjacent education copy.

## Source materials

- `SECURITY.md`
- `PRODUCT_REQUIREMENTS.md`
- `API_CONTRACTS.md`
- `apps/web/app/privacy/page.tsx`
- `apps/web/app/terms/page.tsx`
- `apps/web/app/consent-disclaimer/page.tsx`
- `apps/web/app/aftercare/page.tsx`
- `apps/web/app/booking/BookingFlowClient.tsx`
- `apps/web/app/booking/deposit-preview/page.tsx`
- `apps/dashboard/app/forms/page.tsx`
- `apps/dashboard/app/payments/page.tsx`
- `apps/dashboard/app/templates/page.tsx`
- `packages/db/prisma/seed.ts`

## Evidence rules

- Do not paste attorney communications, privileged material, secrets, live client data, or raw vendor account details into the repo.
- Record only redacted evidence labels, reviewer role, date, jurisdiction scope, and approved artifact references.
- Keep `LEGAL_REVIEW_STATUS` as `scaffolded` or `review-required` until all required review items are approved.

## Production boundary

InkRoute must not claim production legal readiness until `pnpm legal:verify-review` passes with every required item marked `approved` in `docs/legal/manifests/legal-review-evidence.json`.
