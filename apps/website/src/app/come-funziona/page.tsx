import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DASHBOARD_URL } from "@/lib/api";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ValuePillars } from "@/components/marketing/value-pillars";
import { FaqSection } from "@/components/marketing/faq-section";
import { HOMEPAGE_FAQS } from "@/components/marketing/content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = buildMetadata({
  title: "Come funziona oncologo.it",
  description:
    "Come funziona la piattaforma: cerca uno specialista, prenota online, accedi a piani nutrizionali AI, corsi ed eventi. Tutto il tuo percorso di cura in un unico posto.",
  path: "/come-funziona",
});

const PRINCIPLES = [
  {
    title: "Specialisti verificati",
    copy: "Ogni oncologo e cardiologo e selezionato singolarmente dal nostro team. La certificazione ARTOI e il filo conduttore: formazione continua in oncologia integrativa e approccio basato su evidenze.",
  },
  {
    title: "Tecnologia al servizio del paziente",
    copy: "L'intelligenza artificiale genera piani nutrizionali personalizzati. Un assistente AI dedicato, Onciro, risponde alle tue domande 24 ore su 24, integrando il rapporto con lo specialista.",
  },
  {
    title: "Un ecosistema unico",
    copy: "Specialisti, nutrizione, formazione, eventi: tutto in un unico posto. Non una directory di medici: una piattaforma pensata per il percorso di cura oncologico nella sua interezza.",
  },
] as const;

export default function ComeFunzionaPage() {
  return (
    <>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Come funziona", path: "/come-funziona" },
          ]),
          faqJsonLd(HOMEPAGE_FAQS),
        ]}
      />

      <section className="section-x page-hero">
        <div className="container-narrow">
          <p className="mono-label">Come funziona</p>
          <h1 className="text-display text-ink mt-5">
            Una piattaforma per capire, scegliere, proseguire.
          </h1>
          <p className="text-lede mt-7 max-w-2xl">
            Oncologo.it ti accompagna passo dopo passo: dalla ricerca dello
            specialista giusto, alla gestione della nutrizione, fino ai percorsi
            formativi e agli eventi. Ogni area ha una funzione precisa.
          </p>
        </div>
      </section>

      <section className="section-x pb-16 lg:pb-24">
        <div className="container-wide grid gap-4 sm:grid-cols-3">
          {PRINCIPLES.map((item) => (
            <div
              key={item.title}
              className="care-card flex flex-col gap-3 p-6 sm:p-7"
            >
              <h2 className="text-h3 text-ink">{item.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      <HowItWorks
        eyebrow="In tre passi"
        heading="Dalla ricerca alla prima visita"
      />

      <ValuePillars />

      <FaqSection questions={HOMEPAGE_FAQS} />

      <section className="section-x section-y-lg">
        <div className="accent-band container-narrow rounded-[1.25rem] p-10 text-center">
          <h2 className="text-h1 text-ink">Pronto a iniziare?</h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
            Trova lo specialista giusto per te e prenota in pochi secondi.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/specialisti" className="btn-primary">
              Cerca uno specialista
              <ArrowRight className="size-4" />
            </Link>
            <a href={`${DASHBOARD_URL}/signup`} className="btn-secondary">
              Registrati gratuitamente
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
