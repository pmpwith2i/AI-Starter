import type { Metadata } from "next";
import {
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  absoluteUrl,
} from "./site-config";

type OgType = "website" | "article" | "profile";

export interface BuildMetadataInput {
  title?: string;
  description?: string;
  path?: string;
  ogType?: OgType;
  ogImage?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: readonly string[];
  noIndex?: boolean;
}

export const buildMetadata = ({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  ogType = "website",
  ogImage,
  publishedTime,
  modifiedTime,
  authors,
  noIndex = false,
}: BuildMetadataInput = {}): Metadata => {
  const resolvedTitle = title ?? `${SITE_NAME}, ${SITE_TAGLINE}`;
  const canonical = absoluteUrl(path);
  const ogImageUrl = ogImage ? absoluteUrl(ogImage) : undefined;

  return {
    metadataBase: new URL(SITE_URL),
    title: resolvedTitle,
    description,
    alternates: { canonical },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: ogType,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      url: canonical,
      title: resolvedTitle,
      description,
      ...(ogImageUrl ? { images: [{ url: ogImageUrl }] } : {}),
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(authors ? { authors: [...authors] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
    },
  };
};
