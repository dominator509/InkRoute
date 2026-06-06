export function formatCityDateRange(startsAt: string, endsAt: string, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: timezone });
  return `${formatter.format(new Date(startsAt))} – ${formatter.format(new Date(endsAt))}`;
}

export function toTitleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
