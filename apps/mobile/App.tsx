import { useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { getMobileScreen, type MobileScreenId } from "@inkroute/mobile-support";
import { AuthScreen } from "./src/screens/AuthScreen";
import { AppointmentsScreen } from "./src/screens/AppointmentsScreen";
import { BookingRequestsScreen } from "./src/screens/BookingRequestsScreen";
import { ClientsScreen } from "./src/screens/ClientsScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { NotificationsScreen } from "./src/screens/NotificationsScreen";
import { OfflineNotesScreen } from "./src/screens/OfflineNotesScreen";
import { PortfolioUploadScreen } from "./src/screens/PortfolioUploadScreen";
import { SystemStatusScreen } from "./src/screens/SystemStatusScreen";
import { TravelUpdateScreen } from "./src/screens/TravelUpdateScreen";
import { ScreenTabs } from "./src/components/ScreenTabs";
import { mobileQaExecutionPreview } from "./src/lib/mobileQa";

function renderScreen(activeScreen: MobileScreenId) {
  switch (activeScreen) {
    case "auth":
      return <AuthScreen />;
    case "home":
      return <HomeScreen />;
    case "bookings":
      return <BookingRequestsScreen />;
    case "appointments":
      return <AppointmentsScreen />;
    case "clients":
      return <ClientsScreen />;
    case "travel":
      return <TravelUpdateScreen />;
    case "portfolio":
      return <PortfolioUploadScreen />;
    case "notifications":
      return <NotificationsScreen />;
    case "offline":
      return <OfflineNotesScreen />;
    case "system":
      return <SystemStatusScreen />;
  }
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<MobileScreenId>("home");
  const screen = useMemo(() => getMobileScreen(activeScreen), [activeScreen]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0c0a09" }}>
      <StatusBar style="light" />
      <ScrollView stickyHeaderIndices={[1]} contentContainerStyle={{ padding: 20, gap: 18 }}>
        <View style={{ gap: 8 }}>
          <Text style={{ color: "#fafaf9", fontSize: 34, fontWeight: "900" }}>InkRoute Artist</Text>
          <Text style={{ color: "#a8a29e", lineHeight: 22 }}>
            Expo Phase 6 scaffold for artist mobility. Current screen: {screen.label}. Status: {screen.phase6Status}.
          </Text>
          <Text style={{ color: "#a8a29e", lineHeight: 22 }}>
            QA contract: {mobileQaExecutionPreview.screens.length} screens mapped · {mobileQaExecutionPreview.blockingItemIds.length} device/runtime checks still gated.
          </Text>
        </View>
        <View style={{ backgroundColor: "#0c0a09", paddingVertical: 4 }}>
          <ScreenTabs active={activeScreen} onChange={setActiveScreen} />
        </View>
        {renderScreen(activeScreen)}
      </ScrollView>
    </SafeAreaView>
  );
}
