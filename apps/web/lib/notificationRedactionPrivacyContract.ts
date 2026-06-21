export interface NotificationRedactionPrivacyInput {
  readonly artifactPath: string;
  readonly payloadSummary: string;
  readonly containsRawDestination: boolean;
  readonly containsRawMessageBody: boolean;
  readonly containsProviderSecret: boolean;
  readonly containsPrivateUrl: boolean;
  readonly redactedFieldLabels: readonly string[];
}

export interface NotificationRedactionPrivacyDecision {
  readonly status: "pass" | "block";
  readonly artifactPath: string;
  readonly requiredLabels: readonly string[];
  readonly blockers: readonly string[];
}

export const notificationRedactionPrivacyRequiredLabels = [
  "destinationHash",
  "redactedBodyPreview",
  "providerPayloadSummary",
  "redactedFields",
] as const;

export function buildNotificationRedactionPrivacyDecision(
  input: NotificationRedactionPrivacyInput,
): NotificationRedactionPrivacyDecision {
  const blockers: string[] = [];
  const labels = new Set(input.redactedFieldLabels);

  if (!input.artifactPath.trim()) blockers.push("Notification artifact path is required for redaction review.");
  if (!input.payloadSummary.trim()) blockers.push("Notification artifact payload summary is required for redaction review.");
  if (input.containsRawDestination) blockers.push("Notification artifacts must not contain raw email addresses, phone numbers, push tokens, or destinations.");
  if (input.containsRawMessageBody) blockers.push("Notification artifacts must not contain raw message bodies.");
  if (input.containsProviderSecret) blockers.push("Notification artifacts must not contain provider secrets or API keys.");
  if (input.containsPrivateUrl) blockers.push("Notification artifacts must not contain private upload or dashboard URLs.");

  for (const label of notificationRedactionPrivacyRequiredLabels) {
    if (!labels.has(label)) blockers.push(`Notification artifact must include redaction label: ${label}.`);
  }

  return {
    status: blockers.length === 0 ? "pass" : "block",
    artifactPath: input.artifactPath,
    requiredLabels: notificationRedactionPrivacyRequiredLabels,
    blockers,
  };
}
