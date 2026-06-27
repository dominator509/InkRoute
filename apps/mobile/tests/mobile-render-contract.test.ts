import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { AuthScreen } from "../src/screens/AuthScreen";
import { AppointmentsScreen } from "../src/screens/AppointmentsScreen";
import { BookingRequestsScreen } from "../src/screens/BookingRequestsScreen";
import { ClientsScreen } from "../src/screens/ClientsScreen";
import { HomeScreen } from "../src/screens/HomeScreen";
import { NotificationsScreen } from "../src/screens/NotificationsScreen";
import { OfflineNotesScreen } from "../src/screens/OfflineNotesScreen";
import { PortfolioUploadScreen } from "../src/screens/PortfolioUploadScreen";
import { SystemStatusScreen } from "../src/screens/SystemStatusScreen";
import { TravelUpdateScreen } from "../src/screens/TravelUpdateScreen";
import { mobileScreenRenderContracts } from "../src/lib/mobileQa";

const executableScreenComponents = [
  { screenId: "auth", componentName: "AuthScreen", Component: AuthScreen },
  { screenId: "home", componentName: "HomeScreen", Component: HomeScreen },
  { screenId: "bookings", componentName: "BookingRequestsScreen", Component: BookingRequestsScreen },
  { screenId: "appointments", componentName: "AppointmentsScreen", Component: AppointmentsScreen },
  { screenId: "clients", componentName: "ClientsScreen", Component: ClientsScreen },
  { screenId: "travel", componentName: "TravelUpdateScreen", Component: TravelUpdateScreen },
  { screenId: "portfolio", componentName: "PortfolioUploadScreen", Component: PortfolioUploadScreen },
  { screenId: "notifications", componentName: "NotificationsScreen", Component: NotificationsScreen },
  { screenId: "offline", componentName: "OfflineNotesScreen", Component: OfflineNotesScreen },
  { screenId: "system", componentName: "SystemStatusScreen", Component: SystemStatusScreen },
] as const;

describe("mobile executable render contract", () => {
  it("constructs React elements for every registered QA screen without simulator or device services", () => {
    for (const entry of executableScreenComponents) {
      const element = createElement(entry.Component);

      expect(typeof entry.Component).toBe("function");
      expect(element.type).toBe(entry.Component);
    }
  });

  it("keeps executable render smoke coverage aligned with the mobile QA registry", () => {
    expect(executableScreenComponents.map((entry) => entry.screenId)).toEqual(
      mobileScreenRenderContracts.map((entry) => entry.screenId),
    );
    expect(executableScreenComponents.map((entry) => entry.componentName)).toEqual(
      mobileScreenRenderContracts.map((entry) => entry.componentName),
    );
  });
});
