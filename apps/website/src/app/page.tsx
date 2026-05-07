import type { Metadata } from "next";
import type {
  BlogPublicListResponse,
  ProfessionalsResponse,
} from "@repo/server-sdk";
import { api } from "@/lib/api";
import { BlogPreview } from "@/components/marketing/blog-preview";
import { CarePathNav } from "@/components/marketing/care-path-nav";
import { FaqSection } from "@/components/marketing/faq-section";
import { FeaturedSpecialists } from "@/components/marketing/featured-specialists";
import { FinalCta } from "@/components/marketing/final-cta";
import { HeroSearch } from "@/components/marketing/hero-search";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Manifesto } from "@/components/marketing/manifesto";
import { PricingTransparency } from "@/components/marketing/pricing-transparency";
import { SpecialtyTiles } from "@/components/marketing/specialty-tiles";
import { Testimonials } from "@/components/marketing/testimonials";
import { TrustBar } from "@/components/marketing/trust-bar";
import { ValuePillars } from "@/components/marketing/value-pillars";
import { HOMEPAGE_FAQS } from "@/components/marketing/content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buildMetadata } from "@/lib/seo/metadata";
import { faqJsonLd } from "@/lib/seo/jsonld";
import { SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/seo/site-config";

export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: `oncologo.it, ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  path: "/",
});

type Professional = ProfessionalsResponse["data"][number];
type BlogPost = BlogPublicListResponse["data"][number];

const fetchFeaturedSpecialists = async (): Promise<readonly Professional[]> => {
  try {
    const res = await api.appointments.listProfessionals({ page: 1, limit: 3 });
    return res.data;
  } catch {
    return [];
  }
};

const fetchLatestPosts = async (): Promise<readonly BlogPost[]> => {
  try {
    const res = await api.blog.publicList({ page: 1, limit: 3 });
    return res.data;
  } catch {
    return [];
  }
};

/**
 * Homepage flow — converted from "every section is identical" to a
 * deliberate dramatic arc:
 *
 *   1. Hero (search + sample card) — sets up the conversion path.
 *   2. Credentials strip — institutional authority, not vanity stats.
 *   3. Manifesto — the warm emotional anchor on cream paper.
 *   4. Specialty directory — magazine table-of-contents pattern.
 *   5. Value pillars — three promises, asymmetric cascade.
 *   6. How it works — three steps.
 *   7. Featured specialists — real profiles with availability hints.
 *   8. Pricing transparency — no surprise tariffs.
 *   9. Testimonials — patient voices on warm paper.
 *  10. Blog preview — guides + storie.
 *  11. FAQ — final objection handling.
 *  12. Final CTA — closing on warm cream, not cold ink.
 */
export default async function Home() {
  const [specialists, posts] = await Promise.all([
    fetchFeaturedSpecialists(),
    fetchLatestPosts(),
  ]);

  return (
    <>
      <JsonLdScript data={faqJsonLd(HOMEPAGE_FAQS)} />
      <HeroSearch />
      <TrustBar />
      <CarePathNav />
      <Manifesto />
      <SpecialtyTiles />
      <ValuePillars />
      <HowItWorks />
      <FeaturedSpecialists specialists={specialists} />
      <PricingTransparency />
      <Testimonials />
      <BlogPreview posts={posts} />
      <FaqSection
        questions={HOMEPAGE_FAQS}
        subheading="Se non trovi la tua risposta, scrivici: ti ricontattiamo in giornata."
      />
      <FinalCta />
    </>
  );
}
