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

export interface CanonicalDomainRepositorySnapshot {
  readonly domains: readonly TenantCanonicalDomain[];
  readonly redirects: readonly SeoRedirectRule[];
  readonly evaluations: readonly {
    host: string;
    path: string;
    protocol: "http" | "https";
    shouldRedirect: boolean;
    shouldNoindex: boolean;
    destinationPath: string;
  }[];
}

export interface CanonicalDomainRepository {
  listTenantDomains(tenantId: string): readonly TenantCanonicalDomain[];
  listSeoRedirectRules(tenantId: string): readonly SeoRedirectRule[];
  recordEvaluation(input: CanonicalDomainRepositorySnapshot["evaluations"][number]): void;
  snapshot(): CanonicalDomainRepositorySnapshot;
}

export interface PersistedTenantDomainRow {
  readonly tenantId: string;
  readonly hostname: string;
  readonly status: "pending" | "verified" | "failed" | "disabled" | string;
  readonly isPrimary: boolean;
}

export interface PersistedSeoRedirectRow {
  readonly tenantId: string;
  readonly fromPath: string;
  readonly toPath: string;
  readonly statusCode: number;
  readonly isActive: boolean;
}

export interface CanonicalDomainPrismaClient {
  readonly tenantDomain: {
    findMany(input: {
      readonly where: { readonly tenantId: string; readonly status: "verified" };
      readonly select: { readonly tenantId: true; readonly hostname: true; readonly status: true; readonly isPrimary: true };
      readonly orderBy: readonly [{ readonly isPrimary: "desc" }, { readonly hostname: "asc" }];
    }): Promise<readonly PersistedTenantDomainRow[]>;
  };
  readonly seoRedirect: {
    findMany(input: {
      readonly where: { readonly tenantId: string; readonly isActive: true };
      readonly select: { readonly tenantId: true; readonly fromPath: true; readonly toPath: true; readonly statusCode: true; readonly isActive: true };
      readonly orderBy: readonly [{ readonly fromPath: "asc" }];
    }): Promise<readonly PersistedSeoRedirectRow[]>;
  };
}

export interface PersistedCanonicalDomainRepository {
  listTenantDomains(tenantId: string): Promise<readonly TenantCanonicalDomain[]>;
  listSeoRedirectRules(tenantId: string): Promise<readonly SeoRedirectRule[]>;
  snapshot(tenantId: string): Promise<CanonicalDomainRepositorySnapshot>;
}

function tenantSlugForCanonicalDomain(tenantId: string): string {
  return tenantId === inkrouteDemoTenant.id ? inkrouteDemoTenant.slug : tenantId;
}

export function buildTenantCanonicalDomainsFromRows(rows: readonly PersistedTenantDomainRow[]): readonly TenantCanonicalDomain[] {
  const verifiedRows = rows.filter((row) => row.status === "verified");
  const rowsByTenant = new Map<string, PersistedTenantDomainRow[]>();

  for (const row of verifiedRows) {
    rowsByTenant.set(row.tenantId, [...(rowsByTenant.get(row.tenantId) ?? []), row]);
  }

  return [...rowsByTenant.entries()].map(([tenantId, tenantRows]) => {
    const sortedTenantRows = [...tenantRows].sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary) || left.hostname.localeCompare(right.hostname));
    const primaryRow = sortedTenantRows[0]!;
    return {
      tenantId,
      tenantSlug: tenantSlugForCanonicalDomain(tenantId),
      primaryHost: primaryRow.hostname,
      allowedHosts: sortedTenantRows.map((row) => row.hostname),
      forceHttps: true,
    };
  });
}

export function buildSeoRedirectRulesFromRows(rows: readonly PersistedSeoRedirectRow[]): readonly SeoRedirectRule[] {
  return rows
    .filter((row) => row.isActive)
    .map((row) => ({
      tenantId: row.tenantId,
      fromPath: row.fromPath,
      toPath: row.toPath,
      statusCode: row.statusCode,
      isActive: row.isActive,
    }));
}

export function createPrismaCanonicalDomainRepository(client: CanonicalDomainPrismaClient): PersistedCanonicalDomainRepository {
  return {
    async listTenantDomains(tenantId) {
      const rows = await client.tenantDomain.findMany({
        where: { tenantId, status: "verified" },
        select: { tenantId: true, hostname: true, status: true, isPrimary: true },
        orderBy: [{ isPrimary: "desc" }, { hostname: "asc" }],
      });
      return buildTenantCanonicalDomainsFromRows(rows);
    },
    async listSeoRedirectRules(tenantId) {
      const rows = await client.seoRedirect.findMany({
        where: { tenantId, isActive: true },
        select: { tenantId: true, fromPath: true, toPath: true, statusCode: true, isActive: true },
        orderBy: [{ fromPath: "asc" }],
      });
      return buildSeoRedirectRulesFromRows(rows);
    },
    async snapshot(tenantId) {
      const [domains, redirects] = await Promise.all([this.listTenantDomains(tenantId), this.listSeoRedirectRules(tenantId)]);
      return { domains, redirects, evaluations: [] };
    },
  };
}

export function createInMemoryCanonicalDomainRepository(input: {
  domains?: readonly TenantCanonicalDomain[];
  redirects?: readonly SeoRedirectRule[];
} = {}): CanonicalDomainRepository {
  const domains = [...(input.domains ?? publicTenantCanonicalDomains)];
  const redirects = [...(input.redirects ?? publicSeoRedirectRules)];
  const evaluations: CanonicalDomainRepositorySnapshot["evaluations"][number][] = [];

  return {
    listTenantDomains(tenantId) {
      return domains.filter((domain) => domain.tenantId === tenantId);
    },
    listSeoRedirectRules(tenantId) {
      return redirects.filter((rule) => rule.tenantId === tenantId && rule.isActive);
    },
    recordEvaluation(input) {
      evaluations.push(input);
    },
    snapshot() {
      return {
        domains: [...domains],
        redirects: [...redirects],
        evaluations: [...evaluations],
      };
    },
  };
}

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
    ...(route ? { route } : {}),
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

export function evaluateCanonicalRequestWithRepository(
  repository: CanonicalDomainRepository,
  input: { tenantId?: string; tenantSlug?: string; host: string; path: string; protocol: "http" | "https"; method?: string },
) {
  const tenantId = input.tenantId ?? inkrouteDemoTenant.id;
  const policy = resolveTenantCanonicalPolicy({
    requestHost: input.host,
    requestPath: input.path,
    tenantSlug: input.tenantSlug ?? inkrouteDemoTenant.slug,
    tenantId,
    domains: [...repository.listTenantDomains(tenantId)],
    routes: allPublicSeoRoutes,
    protocol: input.protocol,
  });
  const route = allPublicSeoRoutes.find((candidate) => candidate.canonicalPath === policy.canonicalPath || candidate.path === policy.canonicalPath);
  const redirectDecision = buildSeoRedirectDecision({
    tenantId,
    path: policy.canonicalPath,
    ...(route ? { route } : {}),
    rules: [...repository.listSeoRedirectRules(tenantId)],
  });
  const result = {
    policy,
    redirectDecision,
    applies: shouldApplyCanonicalPolicy(input.path, input.method),
    shouldRedirect: shouldApplyCanonicalPolicy(input.path, input.method) && (policy.shouldForceHttps || policy.shouldRedirectHost || redirectDecision.action === "redirect"),
    shouldNoindex: shouldApplyCanonicalPolicy(input.path, input.method) && redirectDecision.action === "noindex",
    statusCode: redirectDecision.action === "redirect" ? (redirectDecision.statusCode ?? 308) : 308,
    destinationPath: redirectDecision.destinationPath ?? policy.canonicalPath,
  };
  repository.recordEvaluation({
    host: input.host,
    path: input.path,
    protocol: input.protocol,
    shouldRedirect: result.shouldRedirect,
    shouldNoindex: result.shouldNoindex,
    destinationPath: result.destinationPath,
  });
  return result;
}

export async function evaluateCanonicalRequestWithPersistedRepository(
  repository: PersistedCanonicalDomainRepository,
  input: { tenantId?: string; tenantSlug?: string; host: string; path: string; protocol: "http" | "https"; method?: string },
) {
  const tenantId = input.tenantId ?? inkrouteDemoTenant.id;
  const [domains, redirects] = await Promise.all([repository.listTenantDomains(tenantId), repository.listSeoRedirectRules(tenantId)]);
  const inMemoryRepository = createInMemoryCanonicalDomainRepository({ domains, redirects });
  return evaluateCanonicalRequestWithRepository(inMemoryRepository, input);
}
