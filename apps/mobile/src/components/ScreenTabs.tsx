import { Pressable, ScrollView, Text } from "react-native";
import { mobileScreenRegistry, type MobileScreenId } from "@inkroute/mobile-support";

export function ScreenTabs({ active, onChange }: { active: MobileScreenId; onChange: (screen: MobileScreenId) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
      {mobileScreenRegistry.map((screen) => {
        const isActive = screen.id === active;
        return (
          <Pressable
            key={screen.id}
            onPress={() => onChange(screen.id)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: isActive ? "#fbbf24" : "#44403c",
              backgroundColor: isActive ? "#451a03" : "#1c1917",
            }}
          >
            <Text style={{ color: isActive ? "#fef3c7" : "#d6d3d1", fontWeight: "900" }}>{screen.shortLabel}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
