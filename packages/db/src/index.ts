export { prisma } from "./prisma";
export {
  assertTenantScopedData,
  assertTenantScopedWhere,
  tenantOwnedModelNames,
  withTenantData,
  withTenantWhere,
} from "./tenant-scope";
export type {
  TenantOwnedModelName,
  TenantScope,
  TenantScopedMutation,
  TenantScopedWhere,
} from "./tenant-scope";
