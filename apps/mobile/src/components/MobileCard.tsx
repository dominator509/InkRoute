import type { ReactNode } from "react";
import { Text, View } from "react-native";

interface MobileCardProps {
  key?: string;
  children?: ReactNode;
  title?: string;
  eyebrow?: string;
  detail?: string;
}

export function MobileCard({ title, eyebrow, detail, children }: MobileCardProps) {
  return (
    <View style={{ borderWidth: 1, borderColor: "#44403c", backgroundColor: "#1c1917", borderRadius: 24, padding: 16, gap: 10 }}>
      {eyebrow ? <Text style={{ color: "#fbbf24", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 }}>{eyebrow}</Text> : null}
      {title ? <Text style={{ color: "#fafaf9", fontSize: 20, fontWeight: "900" }}>{title}</Text> : null}
      {detail ? <Text style={{ color: "#d6d3d1", lineHeight: 20 }}>{detail}</Text> : null}
      {children}
    </View>
  );
}
