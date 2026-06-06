import type { TravelStop } from "@inkroute/types";

function formatDateRange(stop: TravelStop) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: stop.timezone });
  return `${formatter.format(new Date(stop.startsAt))} – ${formatter.format(new Date(stop.endsAt))}`;
}

interface TravelStopCardProps {
  stop: TravelStop;
}

export function TravelStopCard({ stop }: TravelStopCardProps) {
  return (
    <article className="travel-card">
      <div className="travel-card-topline">
        <span className={`status-pill ${stop.bookingStatus}`}>{stop.bookingStatus}</span>
        <span>{formatDateRange(stop)}</span>
      </div>
      <h3>{stop.city}, {stop.region}</h3>
      <p className="muted">{stop.studioName ?? "Studio location shared after acceptance"}</p>
      <p>{stop.publicNotes}</p>
      <div className="travel-actions">
        <a className="button small" href={`/cities/${stop.city.toLowerCase().replaceAll(" ", "-")}-${stop.region.toLowerCase()}`}>City page</a>
        <a className="button secondary small" href="/booking">Request this city</a>
      </div>
    </article>
  );
}
