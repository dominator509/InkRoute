import { Text, View } from "react-native";
import { mobilePortfolioItems } from "../lib/mobileDemo";
import { MobileCard } from "../components/MobileCard";
import { MobilePill } from "../components/MobilePill";
import { MobileScreen } from "../components/MobileScreen";
import { portfolioUploadDraft } from "../lib/mobileDemo";

export function PortfolioUploadScreen() {
  return (
    <MobileScreen
      eyebrow="Portfolio CMS"
      title="Upload and organize work"
      summary="Static mobile upload flow for captions, style tags, healed/fresh labels, placement, city metadata, and SEO alt text. Storage remains scaffolded only."
    >
      <MobileCard title={portfolioUploadDraft.title} eyebrow="Draft metadata" detail={portfolioUploadDraft.storageBoundary}>
        <Text style={{ color: "#d6d3d1" }}>{portfolioUploadDraft.caption}</Text>
        <Text style={{ color: "#a8a29e", marginTop: 6 }}>{portfolioUploadDraft.altText}</Text>
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
