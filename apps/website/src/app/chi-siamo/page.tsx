import type { Metadata } from "next";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, organizationJsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description: "{{ONE_LINER}}",
  path: "/chi-siamo",
});

export default function ChiSiamoPage() {
  return (
    <>
      <JsonLdScript data={organizationJsonLd()} />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/chi-siamo" },
        ])}
      />
      <section className="container-narrow py-24">
        <h1 className="text-h1 mb-6">About {`{{PROJECT_NAME}}`}</h1>
        <p className="text-lg text-muted-foreground">{`{{ONE_LINER}}`}</p>
        <p className="mt-6 text-sm text-muted-foreground">
          Replace this placeholder page with your own copy. The
          design-system-agent will rewrite it after the interview.
        </p>
      </section>
    </>
  );
}
