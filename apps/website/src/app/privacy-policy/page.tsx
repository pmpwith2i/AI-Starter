import type { Metadata } from "next";
import { api } from "@/lib/api";
import { LegalPage } from "@/components/legal-page";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Informativa sulla privacy",
  description:
    "Informativa sul trattamento dei dati personali ai sensi del GDPR. Scopri come raccogliamo, usiamo e proteggiamo i tuoi dati.",
  path: "/privacy-policy",
});

export default async function PrivacyPolicyPage() {
  let data: { version: string; updatedAt: string; content: string } | null;
  try {
    data = await api.legal.getPrivacyPolicy();
  } catch {
    data = null;
  }

  return (
    <LegalPage
      title="Informativa sulla privacy"
      version={data?.version}
      updatedAt={data?.updatedAt}
      content={
        data?.content ??
        "Documento temporaneamente non disponibile. Riprova più tardi."
      }
    />
  );
}
