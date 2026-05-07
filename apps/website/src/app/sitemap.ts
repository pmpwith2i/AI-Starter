import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site-config";

// Starter sitemap: static pages only.
// As you scaffold domains (blog, events, etc.), append their entries here
// using the same `toEntry` helper, fetching via `@/lib/data/<domain>.ts`.
const STATIC_PATHS: ReadonlyArray<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/come-funziona", priority: 0.7, changeFrequency: "monthly" },
  { path: "/chi-siamo", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/termini", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookie-policy", priority: 0.3, changeFrequency: "yearly" },
];

const toEntry = (
  path: string,
  priority: number,
  lastModified: Date,
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"],
): MetadataRoute.Sitemap[number] => ({
  url: `${SITE_URL}${path}`,
  lastModified,
  priority,
  ...(changeFrequency ? { changeFrequency } : {}),
});

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return STATIC_PATHS.map((s) =>
    toEntry(s.path, s.priority, now, s.changeFrequency),
  );
}
