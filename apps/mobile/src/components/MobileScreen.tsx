import type { ReactNode } from "react";
import { Text, View } from "react-native";

interface MobileScreenProps {
  children?: ReactNode;
  eyebrow: string;
  title: string;
  summary: string;
}

export function MobileScreen({ eyebrow, title, summary, children }: MobileScreenProps) {
  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 8 }}>
        <Text style={{ color: "#fbbf24", fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.2 }}>{eyebrow}</Text>
        <Text style={{ color: "#fafaf9", fontSize: 32, fontWeight: "900", lineHeight: 36 }}>{title}</Text>
        <Text style={{ color: "#d6d3d1", lineHeight: 22 }}>{summary}</Text>
      </View>
      {children}
    </View>
  );
}
