import { Text, View } from "react-native";
import { MobileCard } from "../components/MobileCard";
import { MobilePill } from "../components/MobilePill";
import { MobileScreen } from "../components/MobileScreen";
import { mobileApiFetch, type MobileApiResponseEnvelope, type MobileApiSession } from "../lib/mobileApiClient";
import { mobileAppointments, mobileIcsPreview } from "../lib/mobileDemo";

export interface MobileAppointmentSummary {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: string;
}

export function loadMobileAppointments(
  session: MobileApiSession,
  requestId = `mobile-appointments:${session.tenantId}`,
): Promise<MobileApiResponseEnvelope<MobileAppointmentSummary[]>> {
  return mobileApiFetch<MobileAppointmentSummary[]>(session, {
    domain: "appointments",
    method: "GET",
    path: "/api/mobile/appointments",
    requestId,
  });
}

export function loadMobileAvailability(
  session: MobileApiSession,
  requestId = `mobile-availability:${session.tenantId}`,
): Promise<MobileApiResponseEnvelope<unknown[]>> {
  return mobileApiFetch<unknown[]>(session, {
    domain: "appointments",
    method: "GET",
    path: "/api/mobile/availability",
    requestId,
  });
}

export function AppointmentsScreen() {
  return (
    <MobileScreen
      eyebrow="Appointment calendar"
      title="Travel-aware schedule"
      summary="Appointment cards show buffers and city context. Google Calendar sync, conflict checks, and timezone libraries remain externally dependent."
    >
      {mobileAppointments.map((appointment) => (
        <MobileCard key={appointment.id} title={appointment.title} eyebrow={appointment.city}>
          <Text style={{ color: "#fafaf9", fontWeight: "900" }}>{appointment.time}</Text>
          <Text style={{ color: "#d6d3d1" }}>{appointment.client}</Text>
          <Text style={{ color: "#a8a29e" }}>{appointment.duration}</Text>
          <MobilePill label={appointment.status} tone={appointment.status === "Tentative" ? "warn" : "good"} />
        </MobileCard>
      ))}
      <MobileCard title="ICS helper preview" eyebrow="Shared calendar package" detail={`${mobileIcsPreview}...`} />
    </MobileScreen>
  );
}
