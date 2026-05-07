import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PrivacyNotice } from "@/components/privacy-notice";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buildMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";
import { BRAND_PRIMARY_HEX } from "@/lib/seo/site-config";

const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const metadata: Metadata = buildMetadata();

export const viewport: Viewport = {
  themeColor: BRAND_PRIMARY_HEX,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="h-full antialiased">
      <head>
        <link rel="preconnect" href={PUBLIC_API_URL} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={PUBLIC_API_URL} />
        <link
          rel="preconnect"
          href="https://images.unsplash.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex min-h-full flex-col">
        <JsonLdScript data={[organizationJsonLd(), websiteJsonLd()]} />
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
        <PrivacyNotice />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
