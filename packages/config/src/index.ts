import type { ArtistProfile, DashboardMetric, PortfolioItem, TattooStyle, Tenant, TravelStop } from "@inkroute/types";

export const inkrouteDemoTenant: Tenant = {
  id: "tenant_demo_nomad",
  name: "InkRoute Demo Studio",
  slug: "inkroute-demo",
  plan: "nomad",
  status: "trial",
  publicSiteName: "Mara Vale Tattoo",
  defaultTimezone: "America/Los_Angeles",
};

export const inkrouteDemoArtist: ArtistProfile = {
  id: "artist_mara_vale",
  tenantId: inkrouteDemoTenant.id,
  displayName: "Mara Vale",
  slug: "mara-vale",
  bio: "A nomadic blackwork and ornamental tattoo artist building quiet, durable pieces for clients across the West Coast. Mara works by appointment only, prioritizing precise intake, healed results, and calm private sessions.",
  shortBio: "Nomadic blackwork, ornamental, and fine-line tattooing across the West Coast.",
  homeBaseCity: "Portland, OR",
  specialties: ["blackwork", "ornamental", "fine_line"],
  instagramUrl: "https://instagram.com/example",
  bookingEnabled: true,
};

export const demoTravelStops: TravelStop[] = [
  {
    id: "travel_seattle_july",
    tenantId: inkrouteDemoTenant.id,
    artistId: inkrouteDemoArtist.id,
    city: "Seattle",
    region: "WA",
    country: "US",
    timezone: "America/Los_Angeles",
    startsAt: "2026-07-10T10:00:00-07:00",
    endsAt: "2026-07-15T18:00:00-07:00",
    studioName: "Guest Spot Studio",
    bookingStatus: "open",
    publicNotes: "Priority for ornamental sleeves, blackwork panels, and flash pieces. Limited consult windows available before deposit requests go out.",
  },
  {
    id: "travel_san_diego_august",
    tenantId: inkrouteDemoTenant.id,
    artistId: inkrouteDemoArtist.id,
    city: "San Diego",
    region: "CA",
    country: "US",
    timezone: "America/Los_Angeles",
    startsAt: "2026-08-04T10:00:00-07:00",
    endsAt: "2026-08-09T18:00:00-07:00",
    studioName: "Private guest spot",
    bookingStatus: "waitlist",
    publicNotes: "Waitlist open for medium and large custom work. Flash drop interest will be prioritized if cancellations open.",
  },
  {
    id: "travel_oakland_september",
    tenantId: inkrouteDemoTenant.id,
    artistId: inkrouteDemoArtist.id,
    city: "Oakland",
    region: "CA",
    country: "US",
    timezone: "America/Los_Angeles",
    startsAt: "2026-09-18T10:00:00-07:00",
    endsAt: "2026-09-22T18:00:00-07:00",
    studioName: "Quiet private studio",
    bookingStatus: "open",
    publicNotes: "Custom blackwork, healed-photo follow-ups, and ornamental fillers. Best fit for clients ready with placement and size notes.",
  },
];

export const demoPortfolioItems: PortfolioItem[] = [
  {
    id: "portfolio_orbital_serpent",
    tenantId: inkrouteDemoTenant.id,
    artistId: inkrouteDemoArtist.id,
    title: "Orbital Serpent",
    slug: "orbital-serpent",
    caption: "Blackwork serpent wrapped through geometric orbit lines with healed contrast and readable flow.",
    styles: ["blackwork", "ornamental"],
    placement: "forearm",
    freshness: "healed",
    city: "Portland",
    imageUrl: "/demo/portfolio/orbital-serpent.jpg",
    altText: "Healed blackwork serpent tattoo on forearm with geometric orbit lines",
    isFeatured: true,
    isPublic: true,
    attributionKey: "pf_orbital_serpent",
  },
  {
    id: "portfolio_ritual_floral",
    tenantId: inkrouteDemoTenant.id,
    artistId: inkrouteDemoArtist.id,
    title: "Ritual Floral",
    slug: "ritual-floral",
    caption: "Fine-line floral composition with ornamental framing designed to sit cleanly on the upper arm.",
    styles: ["fine_line", "ornamental"],
    placement: "upper_arm",
    freshness: "fresh",
    city: "Oakland",
    imageUrl: "/demo/portfolio/ritual-floral.jpg",
    altText: "Fresh fine-line floral upper arm tattoo with ornamental framing",
    isFeatured: true,
    isPublic: true,
    attributionKey: "pf_ritual_floral",
  },
  {
    id: "portfolio_black_sun",
    tenantId: inkrouteDemoTenant.id,
    artistId: inkrouteDemoArtist.id,
    title: "Black Sun Flash",
    slug: "black-sun-flash",
    caption: "Bookable flash concept designed for travel weeks and quick guest spot scheduling.",
    styles: ["blackwork", "flash"],
    placement: "leg",
    freshness: "fresh",
    city: "Los Angeles",
    imageUrl: "/demo/portfolio/black-sun.jpg",
    altText: "Blackwork sun flash tattoo on leg",
    isFeatured: true,
    isPublic: true,
    attributionKey: "pf_black_sun",
  },
  {
    id: "portfolio_silent_gate",
    tenantId: inkrouteDemoTenant.id,
    artistId: inkrouteDemoArtist.id,
    title: "Silent Gate",
    slug: "silent-gate",
    caption: "Architectural ornamental back piece planned around negative space and long-session endurance.",
    styles: ["ornamental", "blackwork"],
    placement: "back",
    freshness: "in_progress",
    city: "Seattle",
    imageUrl: "/demo/portfolio/silent-gate.jpg",
    altText: "In-progress ornamental blackwork back tattoo with architectural symmetry",
    isFeatured: false,
    isPublic: true,
    attributionKey: "pf_silent_gate",
  },
  {
    id: "portfolio_moon_thread",
    tenantId: inkrouteDemoTenant.id,
    artistId: inkrouteDemoArtist.id,
    title: "Moon Thread",
    slug: "moon-thread",
    caption: "Fine-line lunar threadwork built for a subtle rib placement with precise intake planning.",
    styles: ["fine_line"],
    placement: "ribs",
    freshness: "healed",
    city: "San Diego",
    imageUrl: "/demo/portfolio/moon-thread.jpg",
    altText: "Healed fine-line lunar tattoo on ribs",
    isFeatured: false,
    isPublic: true,
    attributionKey: "pf_moon_thread",
  },
  {
    id: "portfolio_bone_orchid",
    tenantId: inkrouteDemoTenant.id,
    artistId: inkrouteDemoArtist.id,
    title: "Bone Orchid",
    slug: "bone-orchid",
    caption: "Custom floral blackwork piece with placement notes captured before consult.",
    styles: ["blackwork", "custom"],
    placement: "shoulder",
    freshness: "fresh",
    city: "Oakland",
    imageUrl: "/demo/portfolio/bone-orchid.jpg",
    altText: "Fresh custom floral blackwork shoulder tattoo",
    isFeatured: false,
    isPublic: true,
    attributionKey: "pf_bone_orchid",
  },
];

export interface PublicFaqItem {
  question: string;
  answer: string;
  category: "booking" | "travel" | "prep" | "aftercare" | "safety";
}

export const publicFaqs: PublicFaqItem[] = [
  {
    category: "booking",
    question: "Do I need a deposit?",
    answer: "Deposits are planned through Stripe in a later phase. This demo explains the deposit boundary but does not collect money.",
  },
  {
    category: "travel",
    question: "Can I book in another city?",
    answer: "Yes. Nomad Mode publishes upcoming cities, guest spots, and booking status so clients can request work around the artist travel schedule.",
  },
  {
    category: "booking",
    question: "What makes a strong request?",
    answer: "A strong request includes style, placement, approximate size, budget range, preferred city, reference direction, and clear notes about timing or constraints.",
  },
  {
    category: "safety",
    question: "Can I include medical or skin notes?",
    answer: "The future intake flow will keep sensitive notes private. This static demo does not store medical information and final language needs legal review.",
  },
  {
    category: "prep",
    question: "How do I prepare for an appointment?",
    answer: "Arrive rested, hydrated, fed, and with clean skin. Avoid alcohol before the session. Artist-specific prep messages are planned for automation.",
  },
  {
    category: "aftercare",
    question: "Will aftercare instructions be sent after the appointment?",
    answer: "Aftercare automation is planned. The public aftercare page is educational demo content until reviewed for the artist and jurisdiction.",
  },
];

export interface PublicTestimonial {
  id: string;
  displayName: string;
  city: string;
  rating: number;
  quote: string;
  context: string;
}

export const demoTestimonials: PublicTestimonial[] = [
  {
    id: "review_01",
    displayName: "Ari M.",
    city: "Portland",
    rating: 5,
    quote: "The intake made it easy to explain the idea before I ever stepped into the studio.",
    context: "Custom blackwork forearm piece",
  },
  {
    id: "review_02",
    displayName: "Jon R.",
    city: "Seattle",
    rating: 5,
    quote: "Clear travel dates, clear expectations, and the healed result looked exactly like the portfolio promised.",
    context: "Guest spot ornamental work",
  },
  {
    id: "review_03",
    displayName: "Mina L.",
    city: "Oakland",
    rating: 5,
    quote: "I loved knowing what information mattered before requesting a consult.",
    context: "Fine-line floral session",
  },
];

export interface SeoCityLandingPage {
  slug: string;
  city: string;
  region: string;
  country: string;
  title: string;
  metaDescription: string;
  heroSummary: string;
  bestFor: string[];
  canonicalPath: string;
}

export const demoSeoCityPages: SeoCityLandingPage[] = [
  {
    slug: "seattle-wa",
    city: "Seattle",
    region: "WA",
    country: "US",
    title: "Seattle Tattoo Guest Spot Booking | Mara Vale",
    metaDescription: "Request blackwork, ornamental, and fine-line tattoo appointments during Mara Vale's Seattle guest spot dates.",
    heroSummary: "Seattle guest spot requests are open for ornamental sleeves, blackwork panels, and travel-week flash concepts.",
    bestFor: ["ornamental sleeves", "blackwork forearm pieces", "flash travel slots"],
    canonicalPath: "/cities/seattle-wa",
  },
  {
    slug: "san-diego-ca",
    city: "San Diego",
    region: "CA",
    country: "US",
    title: "San Diego Tattoo Waitlist | Mara Vale",
    metaDescription: "Join the San Diego tattoo waitlist for upcoming blackwork, fine-line, and ornamental guest spot appointments.",
    heroSummary: "San Diego is currently waitlist-first, built for clients ready to move quickly if a travel week slot opens.",
    bestFor: ["medium custom pieces", "fine-line ribs", "blackwork flash interest"],
    canonicalPath: "/cities/san-diego-ca",
  },
  {
    slug: "oakland-ca",
    city: "Oakland",
    region: "CA",
    country: "US",
    title: "Oakland Tattoo Booking | Mara Vale",
    metaDescription: "Book Oakland tattoo sessions for custom blackwork, ornamental, and fine-line pieces with a private studio workflow.",
    heroSummary: "Oakland availability is focused on quiet private sessions, healed follow-ups, and design-forward custom work.",
    bestFor: ["custom blackwork", "healed photo follow-ups", "ornamental fillers"],
    canonicalPath: "/cities/oakland-ca",
  },
];

export interface SeoStyleLandingPage {
  slug: string;
  style: TattooStyle;
  label: string;
  title: string;
  metaDescription: string;
  heroSummary: string;
  sessionFit: string[];
  canonicalPath: string;
}

export const demoSeoStylePages: SeoStyleLandingPage[] = [
  {
    slug: "blackwork",
    style: "blackwork",
    label: "Blackwork",
    title: "Blackwork Tattoo Booking | Mara Vale",
    metaDescription: "Explore blackwork tattoos, placement guidance, healed examples, and booking availability for a nomadic tattoo artist.",
    heroSummary: "High-contrast blackwork designed for clear placement, durable readability, and strong healed results.",
    sessionFit: ["forearm panels", "leg flash", "large ornamental anchors"],
    canonicalPath: "/styles/blackwork",
  },
  {
    slug: "ornamental",
    style: "ornamental",
    label: "Ornamental",
    title: "Ornamental Tattoo Booking | Mara Vale",
    metaDescription: "Plan ornamental tattoo appointments with style examples, placement guidance, and city-based travel availability.",
    heroSummary: "Symmetry, flow, negative space, and body-aware composition for ornamental pieces across travel stops.",
    sessionFit: ["sleeves", "back compositions", "upper-arm frames"],
    canonicalPath: "/styles/ornamental",
  },
  {
    slug: "fine-line",
    style: "fine_line",
    label: "Fine Line",
    title: "Fine-Line Tattoo Booking | Mara Vale",
    metaDescription: "Request fine-line tattoo work with thoughtful intake for placement, scale, and long-term clarity.",
    heroSummary: "Delicate work planned around scale, skin movement, and realistic healed expectations.",
    sessionFit: ["floral studies", "subtle rib pieces", "small personal symbols"],
    canonicalPath: "/styles/fine-line",
  },
  {
    slug: "flash",
    style: "flash",
    label: "Flash",
    title: "Flash Tattoo Drops | Mara Vale",
    metaDescription: "Preview flash tattoo concepts for travel weeks and future limited booking drops.",
    heroSummary: "Limited travel-week concepts built for quick scheduling, clear deposits, and artist-approved placement options.",
    sessionFit: ["travel-week openings", "pre-drawn concepts", "limited flash drops"],
    canonicalPath: "/styles/flash",
  },
];

export const bookingIntakePreview = [
  "Preferred city and travel dates",
  "Style, placement, size, and budget range",
  "Reference direction and portfolio inspiration",
  "Medical/safety notes handled privately in later phases",
  "Policy acknowledgment before deposit request",
];

export const aftercareSteps = [
  "Follow the artist's final wrap and washing instructions.",
  "Wash hands before touching the tattoo and keep the area clean.",
  "Use a thin layer of approved aftercare product if directed.",
  "Avoid swimming, soaking, sun exposure, and friction while healing.",
  "Send a healed photo when requested so the artist can track long-term results.",
];

export const dashboardMetrics: DashboardMetric[] = [
  { label: "Open requests", value: "18", detail: "+6 this week" },
  { label: "Deposits pending", value: "$2.4k", detail: "Stripe not connected" },
  { label: "Next city", value: "Seattle", detail: "July 10-15" },
  { label: "Readiness avg", value: "82%", detail: "Demo score" },
];

export const publicNavItems = [
  { href: "/about", label: "About" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/travel", label: "Travel" },
  { href: "/aftercare", label: "Aftercare" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/trust", label: "Trust" },
  { href: "/booking", label: "Book" },
];

export const dashboardNavItems = [
  { href: "/", label: "Overview" },
  { href: "/bookings", label: "Bookings" },
  { href: "/calendar", label: "Calendar" },
  { href: "/travel", label: "Travel" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/clients", label: "Clients" },
  { href: "/payments", label: "Payments" },
  { href: "/forms", label: "Forms" },
  { href: "/seo", label: "SEO" },
  { href: "/templates", label: "Templates" },
  { href: "/messages", label: "Messages" },
  { href: "/errors", label: "Errors" },
  { href: "/releases", label: "Releases" },
  { href: "/trust", label: "Trust" },
  { href: "/deployment", label: "Deployment" },
  { href: "/settings", label: "Settings" },
];

export const bookingStyleOptions = [
  { value: "blackwork", label: "Blackwork", hint: "High contrast, durable readability, bold negative space." },
  { value: "ornamental", label: "Ornamental", hint: "Symmetry, flow, pattern, and body-aware composition." },
  { value: "fine_line", label: "Fine line", hint: "Delicate work planned around healed clarity and scale." },
  { value: "flash", label: "Flash", hint: "Pre-drawn travel concepts and limited availability drops." },
  { value: "custom", label: "Custom concept", hint: "Artist-led design from references, story, and placement notes." },
] as const;

export const bookingPlacementOptions = [
  { value: "forearm", label: "Forearm" },
  { value: "upper_arm", label: "Upper arm" },
  { value: "shoulder", label: "Shoulder" },
  { value: "ribs", label: "Ribs" },
  { value: "back", label: "Back" },
  { value: "leg", label: "Leg" },
  { value: "thigh", label: "Thigh" },
  { value: "calf", label: "Calf" },
  { value: "chest", label: "Chest" },
  { value: "sternum", label: "Sternum" },
  { value: "hand", label: "Hand" },
  { value: "neck", label: "Neck" },
  { value: "other", label: "Other / not sure" },
] as const;

export const bookingBudgetRanges = [
  "$250-$500",
  "$500-$900",
  "$900-$1,500",
  "$1,500-$2,500",
  "$2,500+",
  "I need artist guidance",
] as const;

export const bookingDateWindows = [
  "Specific date during the travel stop",
  "Flexible during this city week",
  "Weekend only",
  "Weekday preferred",
  "Waitlist me for cancellations",
  "Future city visit is better",
] as const;

export const bookingPolicyAcknowledgements = [
  {
    id: "policyAccepted",
    label: "I understand this is a request, not a confirmed appointment.",
  },
  {
    id: "ageAcknowledged",
    label: "I confirm I meet the artist/studio age and ID requirements for the appointment location.",
  },
  {
    id: "privacyAcknowledged",
    label: "I understand sensitive notes and reference files must be stored privately once persistence is implemented.",
  },
  {
    id: "depositBoundaryAcknowledged",
    label: "I understand deposits are not collected in this demo and will require Stripe test/live credentials later.",
  },
] as const;

export const bookingIntegrationBoundaries = [
  {
    label: "Reference uploads",
    status: "Scaffolded only",
    detail: "The Phase 4 form captures local file metadata only. Signed uploads, storage ACLs, malware scanning, and private/public derivative handling remain external work.",
  },
  {
    label: "Deposit step",
    status: "Credential-gated",
    detail: "Stripe Checkout/Payment Intents, webhooks, refunds, no-show policy enforcement, and receipt delivery are not wired in this environment.",
  },
  {
    label: "Notifications",
    status: "Provider-gated",
    detail: "Email, SMS, and push notifications require provider credentials, compliance language, delivery logging, and opt-out handling.",
  },
  {
    label: "Calendar sync",
    status: "Externally dependent",
    detail: "Google Calendar OAuth, conflict checks, ICS exports, buffer rules, and timezone verification remain planned integrations.",
  },
] as const;

export interface PublicTenantProfile {
  slug: string;
  name: string;
  publicSiteName: string;
  defaultTimezone?: string;
}

export interface PublicArtistProfile {
  slug: string;
  displayName: string;
  bio: string;
  shortBio?: string;
  homeBaseCity?: string;
  specialties: TattooStyle[];
  instagramUrl?: string;
  bookingEnabled?: boolean;
}

export interface PublicPortfolioItem {
  slug: string;
  title: string;
  caption: string;
  styles: TattooStyle[];
  placement: PortfolioItem["placement"];
  freshness: PortfolioItem["freshness"];
  city?: string;
  imageUrl: string;
  altText: string;
  isFeatured: boolean;
}

export interface PublicTravelStop {
  city: string;
  region: string;
  country: string;
  timezone: string;
  startsAt: string;
  endsAt: string;
  studioName?: string;
  bookingStatus: TravelStop["bookingStatus"];
  publicNotes?: string;
}

export interface PublicContentBundle {
  source: "demo-static";
  tenant: PublicTenantProfile;
  artist: PublicArtistProfile;
  portfolioItems: PublicPortfolioItem[];
  travelStops: PublicTravelStop[];
  cityPages: SeoCityLandingPage[];
  stylePages: SeoStyleLandingPage[];
  faqs: PublicFaqItem[];
  testimonials: PublicTestimonial[];
  redactedFields: string[];
  cachePolicy: {
    strategy: "static-demo" | "tenant-revalidated";
    revalidateSeconds: number;
  };
}

const publicContentRedactedFields = [
  "tenant.id",
  "tenant.plan",
  "tenant.status",
  "artist.id",
  "artist.tenantId",
  "portfolio.id",
  "portfolio.tenantId",
  "portfolio.artistId",
  "portfolio.attributionKey",
  "portfolio.isPublic",
  "travel.id",
  "travel.tenantId",
  "travel.artistId",
];

export function normalizeTenantSlug(slug: string): string {
  return decodeURIComponent(slug).trim().toLowerCase();
}

export function buildPublicContentBundle(tenantSlug: string): PublicContentBundle | null {
  if (normalizeTenantSlug(tenantSlug) !== inkrouteDemoTenant.slug) {
    return null;
  }

  return {
    source: "demo-static",
    tenant: {
      slug: inkrouteDemoTenant.slug,
      name: inkrouteDemoTenant.name,
      publicSiteName: inkrouteDemoTenant.publicSiteName ?? inkrouteDemoTenant.name,
      defaultTimezone: inkrouteDemoTenant.defaultTimezone,
    },
    artist: {
      slug: inkrouteDemoArtist.slug,
      displayName: inkrouteDemoArtist.displayName,
      bio: inkrouteDemoArtist.bio,
      shortBio: inkrouteDemoArtist.shortBio,
      homeBaseCity: inkrouteDemoArtist.homeBaseCity,
      specialties: [...inkrouteDemoArtist.specialties],
      instagramUrl: inkrouteDemoArtist.instagramUrl,
      bookingEnabled: inkrouteDemoArtist.bookingEnabled,
    },
    portfolioItems: demoPortfolioItems
      .filter((item) => item.tenantId === inkrouteDemoTenant.id && item.artistId === inkrouteDemoArtist.id && item.isPublic !== false)
      .map((item) => ({
        slug: item.slug,
        title: item.title,
        caption: item.caption,
        styles: [...item.styles],
        placement: item.placement,
        freshness: item.freshness,
        city: item.city,
        imageUrl: item.imageUrl,
        altText: item.altText,
        isFeatured: item.isFeatured,
      })),
    travelStops: demoTravelStops
      .filter((stop) => stop.tenantId === inkrouteDemoTenant.id && stop.artistId === inkrouteDemoArtist.id)
      .map((stop) => ({
        city: stop.city,
        region: stop.region,
        country: stop.country,
        timezone: stop.timezone,
        startsAt: stop.startsAt,
        endsAt: stop.endsAt,
        studioName: stop.studioName,
        bookingStatus: stop.bookingStatus,
        publicNotes: stop.publicNotes,
      })),
    cityPages: demoSeoCityPages.map((page) => ({ ...page, bestFor: [...page.bestFor] })),
    stylePages: demoSeoStylePages.map((page) => ({ ...page, sessionFit: [...page.sessionFit] })),
    faqs: publicFaqs.map((faq) => ({ ...faq })),
    testimonials: demoTestimonials.map((testimonial) => ({ ...testimonial })),
    redactedFields: publicContentRedactedFields,
    cachePolicy: {
      strategy: "static-demo",
      revalidateSeconds: 300,
    },
  };
}
