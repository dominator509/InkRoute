# Tenant Isolation Contract

`@inkroute/db` exposes dependency-light tenant scope helpers so repository implementations have a shared contract before live Prisma integration tests exist.

## Helpers

- `withTenantWhere(scope, where)` adds the expected `tenantId` to read filters.
- `withTenantData(scope, data)` adds the expected `tenantId` to mutation payloads.
- `assertTenantScopedWhere(query, tenantId)` fails unscoped or cross-tenant reads.
- `assertTenantScopedData(mutation, tenantId)` fails unscoped or cross-tenant writes.
- `tenantOwnedModelNames` pins the model inventory that future integration tests must cover.

## Runtime proof still required

This package contract does not prove database isolation. `GAP-022` remains production-blocking until a seeded Postgres integration suite proves cross-tenant reads return no rows, cross-tenant writes are denied, and audit rows include tenant/actor metadata.
