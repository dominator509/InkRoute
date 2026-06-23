import { Text, View } from "react-native";
import { mobilePortfolioItems } from "../lib/mobileDemo";
import { MobileCard } from "../components/MobileCard";
import { MobilePill } from "../components/MobilePill";
import { MobileScreen } from "../components/MobileScreen";
import { mobileApiFetch, type MobileApiResponseEnvelope, type MobileApiSession } from "../lib/mobileApiClient";
import { portfolioUploadDraft } from "../lib/mobileDemo";

export interface MobilePortfolioSummary {
  id: string;
  title: string;
  caption: string;
}

export function loadMobilePortfolio(
  session: MobileApiSession,
  requestId = `mobile-portfolio:${session.tenantId}`,
): Promise<MobileApiResponseEnvelope<MobilePortfolioSummary[]>> {
  return mobileApiFetch<MobilePortfolioSummary[]>(session, {
    domain: "portfolio",
    method: "GET",
    path: "/api/mobile/portfolio",
    requestId,
  });
}

export function createMobilePortfolioUploadIntent(
  session: MobileApiSession,
  input: { filename: string; contentType: string; idempotencyKey: string; requestId?: string },
): Promise<MobileApiResponseEnvelope<{ uploadIntentId: string }>> {
  return mobileApiFetch<{ uploadIntentId: string }>(session, {
    domain: "portfolio",
    method: "POST",
    path: "/api/mobile/portfolio/upload-intents",
    requestId: input.requestId ?? `mobile-portfolio-upload:${input.filename}`,
    idempotencyKey: input.idempotencyKey,
    body: { filename: input.filename, contentType: input.contentType },
  });
}

export function PortfolioUploadScreen() {
  return (
    <MobileScreen
      eyebrow="Portfolio CMS"
      title="Upload and organize work"
      summary="Mobile upload contract flow for captions, style tags, healed/fresh labels, placement, city metadata, SEO alt text, object keys, and signed provider storage gates."
    >
      <MobileCard title={portfolioUploadDraft.title} eyebrow="Draft metadata" detail={portfolioUploadDraft.storageBoundary}>
        <Text style={{ color: "#d6d3d1" }}>{portfolioUploadDraft.caption}</Text>
        <Text style={{ color: "#a8a29e", marginTop: 6 }}>{portfolioUploadDraft.altText}</Text>
        <Text style={{ color: "#a8a29e", marginTop: 6 }}>Object key contract: {portfolioUploadDraft.objectKey}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {portfolioUploadDraft.styleTags.map((tag) => <MobilePill key={tag} label={tag} />)}
          <MobilePill label={portfolioUploadDraft.freshness} tone="warn" />
          <MobilePill label={portfolioUploadDraft.city} />
        </View>
      </MobileCard>
      <MobileCard title="Recent public pieces" eyebrow="Static demo portfolio">
        {mobilePortfolioItems.slice(0, 3).map((item) => (
          <View key={item.id} style={{ borderTopWidth: 1, borderColor: "#44403c", paddingTop: 10, marginTop: 10 }}>
            <Text style={{ color: "#fafaf9", fontWeight: "900" }}>{item.title}</Text>
            <Text style={{ color: "#d6d3d1" }}>{item.caption}</Text>
          </View>
        ))}
      </MobileCard>
    </MobileScreen>
  );
}
