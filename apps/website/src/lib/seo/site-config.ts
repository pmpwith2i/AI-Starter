// Brand-level constants. `personalize.sh` replaces every `{{...}}` placeholder
// from the interview answers. Override values via NEXT_PUBLIC_* env vars at
// runtime if you don't want to bake them at build time.

const DEFAULT_SITE_URL = "https://example.com";

const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;

export const SITE_URL = rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;

export const SITE_NAME = "{{PROJECT_NAME}}";

export const SITE_LEGAL_NAME = "{{COMPANY_NAME}}";

export const SITE_TAGLINE = "{{TAGLINE}}";

export const SITE_DESCRIPTION = "{{ONE_LINER}}";

export const SITE_LOCALE = "en_US";

export const SITE_COUNTRY = "US";

export const DEFAULT_OG_PATH = "/opengraph-image";

export const BRAND_PRIMARY_HEX = "#2e6fb0";

export const BRAND_BACKGROUND_HEX = "#f8f9fb";

export const BRAND_FOREGROUND_HEX = "#1b1d21";

export const SOCIAL_PROFILES: readonly string[] = [];

export const ORGANIZATION_CONTACT = {
  email: "{{CONTACT_EMAIL}}",
  streetAddress: "{{STREET_ADDRESS}}",
  postalCode: "{{POSTAL_CODE}}",
  addressLocality: "{{ADDRESS_CITY}}",
  addressRegion: "{{ADDRESS_REGION}}",
  addressCountry: SITE_COUNTRY,
} as const;

export const absoluteUrl = (path: string): string => {
  if (!path) return SITE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};
