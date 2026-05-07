import type { Metadata } from "next";
import { FaqSection } from "@/components/marketing/faq-section";
import { FinalCta } from "@/components/marketing/final-cta";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Manifesto } from "@/components/marketing/manifesto";
import { PricingTransparency } from "@/components/marketing/pricing-transparency";
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
  title: `Starter, ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  path: "/",
});

/**
 * Starter homepage — built from the marketing components that survived
 * the strip. Replace + reorder with sections that match your domain
 * (the type-cascade-stack skill's design-system-agent will rewrite this
 * after the interview).
 */
export default function Home() {
  return (
    <>
      <JsonLdScript data={faqJsonLd(HOMEPAGE_FAQS)} />
      <TrustBar />
      <Manifesto />
      <ValuePillars />
      <HowItWorks />
      <PricingTransparency />
      <Testimonials />
      <FaqSection
        questions={HOMEPAGE_FAQS}
        subheading="Replace this copy with your own."
      />
      <FinalCta />
    </>
  );
}
