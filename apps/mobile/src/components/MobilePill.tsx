import { Text, View } from "react-native";

export function MobilePill({ label, tone = "neutral" }: { key?: string; label: string; tone?: "neutral" | "good" | "warn" | "danger" }) {
  const toneStyles = {
    neutral: { borderColor: "#57534e", color: "#d6d3d1" },
    good: { borderColor: "#65a30d", color: "#bef264" },
    warn: { borderColor: "#d97706", color: "#fde68a" },
    danger: { borderColor: "#dc2626", color: "#fecaca" },
  }[tone];

  return (
    <View style={{ borderWidth: 1, borderColor: toneStyles.borderColor, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
      <Text style={{ color: toneStyles.color, fontSize: 12, fontWeight: "800" }}>{label}</Text>
    </View>
  );
}
