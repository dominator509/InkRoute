import type { Metadata } from "next";
import type { ReactNode } from "react";
import { inkrouteDemoArtist, publicNavItems } from "@inkroute/config";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "Mara Vale Tattoo — Nomadic Blackwork Booking",
    template: "%s | Mara Vale Tattoo",
  },
  description: "A premium tattoo booking website demo for nomadic artists, portfolio-driven conversion, city availability, guest spots, and deposit-ready workflows.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Mara Vale Tattoo",
    description: "Portfolio-first tattoo booking for blackwork, ornamental, and fine-line travel appointments.",
    type: "website",
    url: siteUrl,
    siteName: "Mara Vale Tattoo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mara Vale Tattoo",
    description: "Nomadic blackwork and ornamental tattoo booking demo powered by InkRoute Suite.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <div className="container nav-shell">
            <a className="brand" href="/" aria-label="Mara Vale Tattoo home">
              <span className="brand-mark">IR</span>
              <span>{inkrouteDemoArtist.displayName}</span>
            </a>
            <nav aria-label="Public navigation" className="site-nav">
              {publicNavItems.map((item) => (
                <a key={item.href} href={item.href} className={item.href === "/booking" ? "nav-cta" : undefined}>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </header>
        <div id="main-content">{children}</div>
        <footer className="site-footer">
          <div className="container footer-grid">
            <div>
              <p className="eyebrow">InkRoute Suite Phase 3 Demo</p>
              <h2>{inkrouteDemoArtist.displayName}</h2>
              <p className="muted">Public website routes use DB-first tenant content where available with safe non-production fallbacks. Live payments, provider uploads, auth, browser proof, and launch evidence remain gap-tracked.</p>
            </div>
            <div className="footer-links" aria-label="Footer links">
              <a href="/portfolio">Portfolio</a>
              <a href="/travel">Travel</a>
              <a href="/faq">FAQ</a>
              <a href="/contact">Contact</a>
              <a href="/trust">Trust</a>
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
