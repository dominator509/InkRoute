export interface TenantScope {
  readonly tenantId: string;
  readonly actorUserId?: string;
}

export interface TenantScopedWhere<TWhere extends Record<string, unknown> = Record<string, unknown>> {
  readonly tenantId: string;
  readonly where: TWhere & { tenantId: string };
}

export interface TenantScopedMutation<TData extends Record<string, unknown> = Record<string, unknown>> {
  readonly tenantId: string;
  readonly data: TData & { tenantId: string };
}

export const tenantOwnedModelNames = [
  "TenantMember",
  "Studio",
  "Artist",
  "Client",
  "ClientProfile",
  "BookingRequest",
  "BookingStateEvent",
  "Appointment",
  "AvailabilityWindow",
  "Deposit",
  "Payment",
  "Refund",
  "PaymentAuditLog",
  "FileAsset",
  "ConsentForm",
  "ConsentSignature",
  "MedicalSafetyAcknowledgment",
  "MessageThread",
  "Message",
  "Notification",
  "NotificationDelivery",
  "SeoCityPage",
  "SeoStylePage",
  "Review",
  "ReleaseRecord",
  "FeatureFlag",
  "AuditLog",
] as const;

export type TenantOwnedModelName = (typeof tenantOwnedModelNames)[number];

function requireTenantId(scope: TenantScope): string {
  const tenantId = scope.tenantId.trim();
  if (!tenantId) {
    throw new Error("Tenant scope requires a non-empty tenantId.");
  }
  return tenantId;
}

export function withTenantWhere<TWhere extends Record<string, unknown>>(scope: TenantScope, where: TWhere): TenantScopedWhere<TWhere> {
  const tenantId = requireTenantId(scope);
  return {
    tenantId,
    where: {
      ...where,
      tenantId,
    },
  };
}

export function withTenantData<TData extends Record<string, unknown>>(scope: TenantScope, data: TData): TenantScopedMutation<TData> {
  const tenantId = requireTenantId(scope);
  return {
    tenantId,
    data: {
      ...data,
      tenantId,
    },
  };
}

export function assertTenantScopedWhere(value: { where?: Record<string, unknown> }, expectedTenantId: string): void {
  if (!value.where || value.where.tenantId !== expectedTenantId) {
    throw new Error("Query is missing the expected tenantId scope.");
  }
}

export function assertTenantScopedData(value: { data?: Record<string, unknown> }, expectedTenantId: string): void {
  if (!value.data || value.data.tenantId !== expectedTenantId) {
    throw new Error("Mutation is missing the expected tenantId scope.");
  }
}
