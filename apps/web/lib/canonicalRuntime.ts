import {
  buildSeoRedirectDecision,
  resolveTenantCanonicalPolicy,
  type SeoRedirectRule,
  type TenantCanonicalDomain,
} from "@inkroute/seo";
import { inkrouteDemoTenant } from "@inkroute/config";
import { allPublicSeoRoutes } from "./seoEngine";

export const publicTenantCanonicalDomains: TenantCanonicalDomain[] = [
  {
    tenantId: inkrouteDemoTenant.id,
    tenantSlug: inkrouteDemoTenant.slug,
    primaryHost: "inkroute.example",
    allowedHosts: ["inkroute.example", "www.inkroute.example", "localhost:3000", "127.0.0.1:3000"],
    forceHttps: true,
  },
];

export const publicSeoRedirectRules: SeoRedirectRule[] = [
  {
    tenantId: inkrouteDemoTenant.id,
    fromPath: "/cities/seattle",
    toPath: "/cities/seattle-wa",
    statusCode: 308,
    isActive: true,
  },
  {
    tenantId: inkrouteDemoTenant.id,
    fromPath: "/blackwork",
    toPath: "/styles/blackwork",
    statusCode: 301,
    isActive: true,
  },
];

export function canonicalUrlForPath(path: string, host = publicTenantCanonicalDomains[0]!.primaryHost): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `https://${host}${normalizedPath}`;
}

export function shouldApplyCanonicalPolicy(path: string, method = "GET"): boolean {
  if (!["GET", "HEAD"].includes(method)) return false;
  if (path.startsWith("/_next") || path.startsWith("/api") || path === "/favicon.ico") return false;
  return true;
}

export function evaluatePublicCanonicalRequest(input: { host: string; path: string; protocol: "http" | "https"; method?: string }) {
  const policy = resolveTenantCanonicalPolicy({
    requestHost: input.host,
    requestPath: input.path,
    tenantSlug: inkrouteDemoTenant.slug,
    tenantId: inkrouteDemoTenant.id,
    domains: publicTenantCanonicalDomains,
    routes: allPublicSeoRoutes,
    protocol: input.protocol,
  });
  const route = allPublicSeoRoutes.find((candidate) => candidate.canonicalPath === policy.canonicalPath || candidate.path === policy.canonicalPath);
  const redirectDecision = buildSeoRedirectDecision({
    tenantId: inkrouteDemoTenant.id,
    path: policy.canonicalPath,
    route,
    rules: publicSeoRedirectRules,
  });

  return {
    policy,
    redirectDecision,
    applies: shouldApplyCanonicalPolicy(input.path, input.method),
    shouldRedirect: shouldApplyCanonicalPolicy(input.path, input.method) && (policy.shouldForceHttps || policy.shouldRedirectHost || redirectDecision.action === "redirect"),
    shouldNoindex: shouldApplyCanonicalPolicy(input.path, input.method) && redirectDecision.action === "noindex",
    statusCode: redirectDecision.action === "redirect" ? (redirectDecision.statusCode ?? 308) : 308,
    destinationPath: redirectDecision.destinationPath ?? policy.canonicalPath,
  };
}
