const DEFAULT_SITE_URL = "https://oncologo.it";

const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;

export const SITE_URL = rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;

export const SITE_NAME = "oncologo.it";

export const SITE_LEGAL_NAME = "Oncologo.it S.r.l.";

export const SITE_TAGLINE = "La piattaforma dedicata ai pazienti oncologici";

export const SITE_DESCRIPTION =
  "Specialisti certificati ARTOI, piani nutrizionali generati dall'intelligenza artificiale, corsi ed eventi dedicati al percorso di cura oncologica.";

export const SITE_LOCALE = "it_IT";

export const SITE_COUNTRY = "IT";

export const DEFAULT_OG_PATH = "/opengraph-image";

export const BRAND_PRIMARY_HEX = "#2e6fb0";

export const BRAND_BACKGROUND_HEX = "#f8f9fb";

export const BRAND_FOREGROUND_HEX = "#1b1d21";

export const SOCIAL_PROFILES: readonly string[] = [
  "https://www.linkedin.com/company/oncologo-it",
  "https://www.instagram.com/oncologo.it",
];

export const ORGANIZATION_CONTACT = {
  email: "ciao@oncologo.it",
  streetAddress: "Via Placeholder 1",
  postalCode: "00100",
  addressLocality: "Roma",
  addressRegion: "RM",
  addressCountry: SITE_COUNTRY,
} as const;

export const absoluteUrl = (path: string): string => {
  if (!path) return SITE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};
