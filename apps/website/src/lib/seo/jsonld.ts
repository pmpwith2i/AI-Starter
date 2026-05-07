import {
  ORGANIZATION_CONTACT,
  SITE_COUNTRY,
  SITE_DESCRIPTION,
  SITE_LEGAL_NAME,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
  SOCIAL_PROFILES,
  absoluteUrl,
} from "./site-config";

type JsonLd = Record<string, unknown>;

const LOGO_URL = absoluteUrl("/icon");

export const organizationJsonLd = (): JsonLd => ({
  "@context": "https://schema.org",
  "@type": ["Organization", "MedicalBusiness"],
  "@id": `${SITE_URL}#organization`,
  name: SITE_NAME,
  legalName: SITE_LEGAL_NAME,
  url: SITE_URL,
  logo: LOGO_URL,
  description: SITE_DESCRIPTION,
  sameAs: [...SOCIAL_PROFILES],
  address: {
    "@type": "PostalAddress",
    streetAddress: ORGANIZATION_CONTACT.streetAddress,
    postalCode: ORGANIZATION_CONTACT.postalCode,
    addressLocality: ORGANIZATION_CONTACT.addressLocality,
    addressRegion: ORGANIZATION_CONTACT.addressRegion,
    addressCountry: ORGANIZATION_CONTACT.addressCountry,
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: ORGANIZATION_CONTACT.email,
      availableLanguage: ["Italian"],
    },
  ],
});

export const websiteJsonLd = (): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}#website`,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: SITE_LOCALE,
  publisher: { "@id": `${SITE_URL}#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/specialisti?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export const breadcrumbJsonLd = (items: readonly BreadcrumbItem[]): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export interface FaqQuestion {
  question: string;
  answer: string;
}

export const faqJsonLd = (questions: readonly FaqQuestion[]): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: questions.map((q) => ({
    "@type": "Question",
    name: q.question,
    acceptedAnswer: { "@type": "Answer", text: q.answer },
  })),
});

export interface ArticleJsonLdInput {
  path: string;
  headline: string;
  description: string;
  image?: string | null;
  datePublished: string;
  dateModified?: string | null;
  authorName?: string;
}

export const articleJsonLd = (input: ArticleJsonLdInput): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "Article",
  mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(input.path) },
  headline: input.headline,
  description: input.description,
  image: input.image ? [input.image] : [LOGO_URL],
  datePublished: input.datePublished,
  dateModified: input.dateModified ?? input.datePublished,
  author: {
    "@type": "Organization",
    name: input.authorName ?? SITE_NAME,
    url: SITE_URL,
  },
  publisher: { "@id": `${SITE_URL}#organization` },
  inLanguage: SITE_LOCALE,
});

export interface EventJsonLdInput {
  path: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string | null;
  image?: string | null;
  priceEurCents?: number | null;
  isOnline: boolean;
  locationName?: string | null;
  locationAddress?: string | null;
  organizerName?: string;
  speakers?: ReadonlyArray<{ name: string }>;
  maxAttendees?: number | null;
  spotsLeft?: number | null;
}

export const eventJsonLd = (input: EventJsonLdInput): JsonLd => {
  const url = absoluteUrl(input.path);
  const location = input.isOnline
    ? { "@type": "VirtualLocation", url }
    : {
        "@type": "Place",
        name: input.locationName ?? SITE_NAME,
        address: input.locationAddress ?? SITE_COUNTRY,
      };

  const offers =
    input.priceEurCents === null || input.priceEurCents === undefined
      ? {
          "@type": "Offer",
          price: 0,
          priceCurrency: "EUR",
          url,
          availability:
            input.spotsLeft !== undefined && input.spotsLeft === 0
              ? "https://schema.org/SoldOut"
              : "https://schema.org/InStock",
        }
      : {
          "@type": "Offer",
          price: (input.priceEurCents / 100).toFixed(2),
          priceCurrency: "EUR",
          url,
          availability:
            input.spotsLeft !== undefined && input.spotsLeft === 0
              ? "https://schema.org/SoldOut"
              : "https://schema.org/InStock",
        };

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.name,
    description: input.description,
    startDate: input.startDate,
    endDate: input.endDate ?? input.startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: input.isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    image: input.image ? [input.image] : [LOGO_URL],
    location,
    offers,
    organizer: {
      "@type": "Organization",
      name: input.organizerName ?? SITE_NAME,
      url: SITE_URL,
    },
    performer:
      input.speakers && input.speakers.length > 0
        ? input.speakers.map((s) => ({ "@type": "Person", name: s.name }))
        : undefined,
    maximumAttendeeCapacity: input.maxAttendees ?? undefined,
    url,
    inLanguage: SITE_LOCALE,
  };
};

export interface CourseJsonLdInput {
  path: string;
  name: string;
  description: string;
  image?: string | null;
  priceEurCents?: number | null;
  totalMinutes?: number | null;
  instructors?: ReadonlyArray<{ name: string }>;
}

const minutesToIsoDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `PT${mins}M`;
  if (mins === 0) return `PT${hours}H`;
  return `PT${hours}H${mins}M`;
};

export const courseJsonLd = (input: CourseJsonLdInput): JsonLd => {
  const url = absoluteUrl(input.path);
  const offers =
    input.priceEurCents === null || input.priceEurCents === undefined
      ? {
          "@type": "Offer",
          category: "Gratuito",
          price: 0,
          priceCurrency: "EUR",
          url,
        }
      : {
          "@type": "Offer",
          price: (input.priceEurCents / 100).toFixed(2),
          priceCurrency: "EUR",
          url,
        };

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: input.name,
    description: input.description,
    image: input.image ? [input.image] : [LOGO_URL],
    provider: { "@id": `${SITE_URL}#organization` },
    inLanguage: SITE_LOCALE,
    url,
    offers,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: input.totalMinutes
        ? minutesToIsoDuration(input.totalMinutes)
        : undefined,
      instructor:
        input.instructors && input.instructors.length > 0
          ? input.instructors.map((i) => ({
              "@type": "Person",
              name: i.name,
            }))
          : undefined,
    },
  };
};

export interface PhysicianJsonLdInput {
  id: string;
  name: string;
  specialty: string;
  specialtyLabel: string;
  bio?: string | null;
  image?: string | null;
  locations?: ReadonlyArray<{
    name?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    region?: string | null;
  }>;
}

export const physicianJsonLd = (input: PhysicianJsonLdInput): JsonLd => {
  const url = absoluteUrl(`/specialisti/${input.id}`);
  const addresses = (input.locations ?? [])
    .filter((l) => l.city || l.address)
    .map((l) => ({
      "@type": "PostalAddress",
      streetAddress: l.address ?? undefined,
      addressLocality: l.city ?? undefined,
      postalCode: l.postalCode ?? undefined,
      addressRegion: l.region ?? undefined,
      addressCountry: SITE_COUNTRY,
    }));

  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    "@id": url,
    name: input.name,
    url,
    image: input.image ?? LOGO_URL,
    description: input.bio ?? undefined,
    medicalSpecialty: input.specialtyLabel,
    worksFor: { "@id": `${SITE_URL}#organization` },
    address: addresses.length > 0 ? addresses : undefined,
  };
};

export interface BundleProductJsonLdInput {
  path: string;
  name: string;
  description: string;
  image?: string | null;
  priceEurCents?: number | null;
  totalSessions?: number | null;
  includedEvents?: ReadonlyArray<{ name: string; url: string }>;
}

export const bundleProductJsonLd = (
  input: BundleProductJsonLdInput,
): JsonLd => {
  const url = absoluteUrl(input.path);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.image ? [input.image] : [LOGO_URL],
    url,
    brand: { "@id": `${SITE_URL}#organization` },
    offers:
      input.priceEurCents !== null && input.priceEurCents !== undefined
        ? {
            "@type": "Offer",
            price: (input.priceEurCents / 100).toFixed(2),
            priceCurrency: "EUR",
            url,
            availability: "https://schema.org/InStock",
          }
        : undefined,
    isRelatedTo:
      input.includedEvents && input.includedEvents.length > 0
        ? input.includedEvents.map((e) => ({
            "@type": "Event",
            name: e.name,
            url: e.url,
          }))
        : undefined,
  };
};

export interface JsonLdScriptProps {
  data: JsonLd | readonly JsonLd[];
}

export const serializeJsonLd = (data: JsonLd | readonly JsonLd[]): string =>
  JSON.stringify(data).replace(/</g, "\\u003c");
