import { Text, View } from "react-native";

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#44403c" }}>
      <Text style={{ color: "#a8a29e" }}>{label}</Text>
      <Text style={{ color: "#fafaf9", fontSize: 24, fontWeight: "800" }}>{value}</Text>
    </View>
  );
}
