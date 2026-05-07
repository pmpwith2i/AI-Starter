import type { Metadata } from "next";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ValuePillars } from "@/components/marketing/value-pillars";
import { FaqSection } from "@/components/marketing/faq-section";
import { HOMEPAGE_FAQS } from "@/components/marketing/content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = buildMetadata({
  title: "How it works",
  description: "{{ONE_LINER}}",
  path: "/come-funziona",
});

export default function ComeFunzionaPage() {
  return (
    <>
      <JsonLdScript data={faqJsonLd(HOMEPAGE_FAQS)} />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "How it works", path: "/come-funziona" },
        ])}
      />
      <section className="container-narrow py-16">
        <h1 className="text-h1 mb-6">How {`{{PROJECT_NAME}}`} works</h1>
        <p className="text-lg text-muted-foreground">
          Replace this page with copy that explains your domain. The
          design-system-agent will rewrite it after the interview.
        </p>
      </section>
      <ValuePillars />
      <HowItWorks />
      <FaqSection
        questions={HOMEPAGE_FAQS}
        subheading="Replace this copy with your own."
      />
    </>
  );
}
