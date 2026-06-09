import type { ReactNode } from "react";
import { evaluateDashboardRouteGuard } from "@inkroute/auth";
import { dashboardNavItems } from "@inkroute/config";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { dashboardShellContext } from "../lib/demo";
import { getLocalDashboardActor, toTenantAccessContext } from "./api/dashboardAuth";
import "./globals.css";

export const metadata = {
  title: "InkRoute Dashboard",
  description: "Private artist/admin dashboard scaffold for InkRoute Suite.",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  noStore();
  const requestHeaders = await headers();
  const routePath = requestHeaders.get("x-matched-path") ?? requestHeaders.get("x-invoke-path") ?? "/dashboard";
  const actor = getLocalDashboardActor();
  const guard = evaluateDashboardRouteGuard({
    context: toTenantAccessContext(actor),
    tenantId: actor.tenantId,
    permission: "booking:read",
    routePath,
    now: new Date().toISOString(),
    loginPath: "/login",
    tenantSwitchPath: "/tenant-switcher",
  });

  if (guard.action === "redirect_login" || guard.action === "redirect_tenant_switch") {
    redirect(guard.redirectTo ?? "/login");
  }

  if (!guard.allowed) {
    notFound();
  }

  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <a className="brand" href="/">
              <span>InkRoute</span>
              <strong>Admin</strong>
            </a>
            <div className="tenant-card" aria-label="Current tenant preview">
              <p>{dashboardShellContext.tenant.publicSiteName}</p>
              <strong>{dashboardShellContext.artist.displayName}</strong>
              <span>{dashboardShellContext.tenant.plan} plan · {dashboardShellContext.tenant.status}</span>
            </div>
            <nav aria-label="Dashboard navigation" className="nav-list">
              {dashboardNavItems.map((item) => (
                <a key={item.href} href={item.href}>{item.label}</a>
              ))}
            </nav>
            <p className="sidebar-note">{dashboardShellContext.authStatus} Guarded by {guard.auditAction}.</p>
          </aside>
          {children}
        </div>
      </body>
    </html>
  );
}
