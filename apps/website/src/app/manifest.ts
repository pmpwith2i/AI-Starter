import type { MetadataRoute } from "next";
import {
  BRAND_BACKGROUND_HEX,
  BRAND_PRIMARY_HEX,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/seo/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "oncologo",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: BRAND_BACKGROUND_HEX,
    theme_color: BRAND_PRIMARY_HEX,
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
    lang: "it",
    categories: ["health", "medical", "lifestyle"],
  };
}
