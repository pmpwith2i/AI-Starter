import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { SITE_URL } from "@/lib/seo/site-config";
import { SPECIALTIES } from "@repo/server-sdk/schemas";

const STATIC_PATHS: ReadonlyArray<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/specialisti", priority: 0.9, changeFrequency: "weekly" },
  { path: "/corsi", priority: 0.8, changeFrequency: "weekly" },
  { path: "/eventi", priority: 0.8, changeFrequency: "weekly" },
  { path: "/eventi/pacchetti", priority: 0.7, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.8, changeFrequency: "daily" },
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [blogResult, eventsResult, bundlesResult, coursesResult, prosResult] =
    await Promise.allSettled([
      api.blog.publicList({ page: 1, limit: 200 }),
      api.events.publicList({ page: 1, limit: 200 }),
      api.bundles.publicList({ page: 1, limit: 100 }),
      api.courses.list({ page: 1, limit: 100 }),
      api.appointments.listProfessionals({ page: 1, limit: 200 }),
    ]);

  const staticEntries = STATIC_PATHS.map((s) =>
    toEntry(s.path, s.priority, now, s.changeFrequency),
  );

  const specialtyEntries = SPECIALTIES.map((s) =>
    toEntry(`/specialisti/${s}`, 0.8, now, "weekly"),
  );

  const blogEntries: MetadataRoute.Sitemap =
    blogResult.status === "fulfilled"
      ? blogResult.value.data.map((post) =>
          toEntry(
            `/blog/${post.slug}`,
            0.6,
            new Date(post.publishedAt),
            "monthly",
          ),
        )
      : [];

  const eventEntries: MetadataRoute.Sitemap =
    eventsResult.status === "fulfilled"
      ? eventsResult.value.data.map((evt) =>
          toEntry(`/eventi/${evt.slug}`, 0.6, new Date(evt.date), "weekly"),
        )
      : [];

  const bundleEntries: MetadataRoute.Sitemap =
    bundlesResult.status === "fulfilled"
      ? bundlesResult.value.data.map((bundle) =>
          toEntry(`/eventi/pacchetti/${bundle.slug}`, 0.6, now, "weekly"),
        )
      : [];

  const courseEntries: MetadataRoute.Sitemap =
    coursesResult.status === "fulfilled"
      ? coursesResult.value.data.map((course) =>
          toEntry(`/corsi/${course.id}`, 0.6, now, "monthly"),
        )
      : [];

  const specialistEntries: MetadataRoute.Sitemap =
    prosResult.status === "fulfilled"
      ? prosResult.value.data.map((pro) =>
          toEntry(`/specialisti/${pro.id}`, 0.6, now, "weekly"),
        )
      : [];

  return [
    ...staticEntries,
    ...specialtyEntries,
    ...blogEntries,
    ...eventEntries,
    ...bundleEntries,
    ...courseEntries,
    ...specialistEntries,
  ];
}
