import type { Metadata } from "next";
import { api } from "@/lib/api";
import { LegalPage } from "@/components/legal-page";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Termini di servizio",
  description:
    "Termini e condizioni d'uso della piattaforma oncologo.it. Consulta i nostri termini di servizio aggiornati.",
  path: "/termini",
});

export default async function TermsPage() {
  let data: { version: string; updatedAt: string; content: string } | null;
  try {
    data = await api.legal.getTerms();
  } catch {
    data = null;
  }

  return (
    <LegalPage
      title="Termini di servizio"
      version={data?.version}
      updatedAt={data?.updatedAt}
      content={
        data?.content ??
        "Documento temporaneamente non disponibile. Riprova più tardi."
      }
    />
  );
}
