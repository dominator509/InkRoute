import { describe, expect, it } from 'vitest';
import { resolveDashboardPermissionForRoute } from '../app/api/dashboardAuth';

describe('dashboard permission resolver', () => {
  it('uses read permissions for dashboard page routes', () => {
    expect(resolveDashboardPermissionForRoute('/dashboard/bookings/abc')).toBe('booking:read');
    expect(resolveDashboardPermissionForRoute('/dashboard/clients')).toBe('client:read');
    expect(resolveDashboardPermissionForRoute('/dashboard/templates/new')).toBe('form:read');
    expect(resolveDashboardPermissionForRoute('/dashboard/settings')).toBe('settings:write');
    expect(resolveDashboardPermissionForRoute('/dashboard/releases')).toBe('release:read');
    expect(resolveDashboardPermissionForRoute('/dashboard/unknown')).toBe('tenant:read');
  });

  it('uses write permissions for dashboard mutating methods', () => {
    expect(resolveDashboardPermissionForRoute('/dashboard/bookings', 'POST')).toBe('booking:write');
    expect(resolveDashboardPermissionForRoute('/dashboard/clients/123', 'PUT')).toBe('client:write');
    expect(resolveDashboardPermissionForRoute('/dashboard/payments', 'DELETE')).toBe('payment:write');
    expect(resolveDashboardPermissionForRoute('/dashboard/templates', 'PATCH')).toBe('form:write');
    expect(resolveDashboardPermissionForRoute('/dashboard/unknown', 'POST')).toBe('tenant:write');
  });

  it('normalizes dashboard-prefixed and raw route variants', () => {
    expect(resolveDashboardPermissionForRoute('/bookings/123', 'DELETE')).toBe('booking:write');
    expect(resolveDashboardPermissionForRoute('/calendar/event')).toBe('calendar:read');
  });

  it('defaults unknown mutating methods to read-only tenant scope', () => {
    expect(resolveDashboardPermissionForRoute('/dashboard/bookings', 'TRACE')).toBe('booking:read');
    expect(resolveDashboardPermissionForRoute('/dashboard/unknown', 'TRACE')).toBe('tenant:read');
  });
});
