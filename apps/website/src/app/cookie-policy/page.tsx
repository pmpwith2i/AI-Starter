import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Cookie Policy",
  description:
    "Informativa sui cookie utilizzati dalla piattaforma oncologo.it. Usiamo solo cookie strettamente necessari al funzionamento del sito.",
  path: "/cookie-policy",
});

const COOKIE_POLICY_PLACEHOLDER = `# Cookie Policy

_Versione placeholder — sostituire con copia legale._

## Cookie utilizzati

oncologo.it utilizza esclusivamente **cookie strettamente necessari** per il funzionamento della piattaforma:
- Cookie di sessione per mantenere l'utente autenticato
- Cookie tecnici per ricordare le preferenze (tema, lingua)

## Cookie NON utilizzati

Non utilizziamo cookie di profilazione, marketing o di terze parti su questo sito.

## Font

Il sito utilizza Google Fonts auto-ospitati tramite Next.js: i file dei font sono scaricati al momento del build e serviti dal nostro server. Nessuna richiesta runtime viene effettuata verso server di Google.

## Modifiche

Aggiorneremo questa pagina ogni volta che cambieranno le tipologie di cookie utilizzate.

---

_Per domande sulla nostra cookie policy, contatta privacy@oncologo.it._`;

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy" content={COOKIE_POLICY_PLACEHOLDER} />
  );
}
