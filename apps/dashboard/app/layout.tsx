import type { ReactNode } from "react";
import { dashboardNavItems } from "@inkroute/config";
import { dashboardShellContext } from "../lib/demo";
import "./globals.css";

export const metadata = {
  title: "InkRoute Dashboard",
  description: "Private artist/admin dashboard scaffold for InkRoute Suite.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
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
            <p className="sidebar-note">{dashboardShellContext.authStatus} Tracked in GAP-003.</p>
          </aside>
          {children}
        </div>
      </body>
    </html>
  );
}
