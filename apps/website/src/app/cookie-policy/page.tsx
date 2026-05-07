import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Cookie Policy",
  description:
    "Cookie policy for {{PROJECT_NAME}}. We only use cookies strictly necessary for the site to function.",
  path: "/cookie-policy",
});

const COOKIE_POLICY_PLACEHOLDER = `# Cookie Policy

_Placeholder version — replace with your legal copy._

## Cookies we use

{{PROJECT_NAME}} uses only **strictly necessary cookies** to operate the
platform:
- Session cookies to keep authenticated users signed in
- Technical cookies for preferences (theme, language)

## What we don't use

We do not set tracking, profiling, or third-party marketing cookies on this
site.

## Changes

We update this page whenever the cookie usage changes.

---

_For questions about our cookie policy, contact {{CONTACT_EMAIL}}._`;

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy" content={COOKIE_POLICY_PLACEHOLDER} />
  );
}
