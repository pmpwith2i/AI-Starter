import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Target } from "lucide-react";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, organizationJsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = buildMetadata({
  title: "Chi siamo",
  description:
    "Oncologo.it e la piattaforma italiana dedicata ai pazienti oncologici. Uniamo specialisti certificati ARTOI, nutrizione AI, formazione e community.",
  path: "/chi-siamo",
});

const VALUES = [
  {
    title: "Evidenze scientifiche",
    icon: Target,
    copy: "Ogni specialista, ogni consiglio nutrizionale, ogni contenuto editoriale e fondato su letteratura scientifica aggiornata.",
  },
  {
    title: "Integrazione reale",
    icon: Sparkles,
    copy: "Non una somma di servizi, ma un ecosistema: specialisti, AI e contenuti si parlano per offrire un percorso coerente.",
  },
  {
    title: "Specializzazione",
    icon: ShieldCheck,
    copy: "Non siamo una directory generica. Oncologo.it nasce dai pazienti oncologici e per i pazienti oncologici.",
  },
];

export default function ChiSiamoPage() {
  return (
    <>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Chi siamo", path: "/chi-siamo" },
          ]),
          organizationJsonLd(),
        ]}
      />

      <section className="section-x page-hero">
        <div className="container-narrow">
          <p className="mono-label">Chi siamo</p>
          <h1 className="text-display text-ink mt-5">
            Un punto fermo per chi vive un percorso oncologico.
          </h1>
          <p className="text-lede mt-7 max-w-2xl">
            Oncologo.it nasce per rispondere a una domanda concreta: dove puo
            trovarsi, in un unico posto, tutto quello che serve a un paziente
            oncologico e alla sua famiglia? Specialisti certificati, supporto
            nutrizionale, formazione e community.
          </p>
        </div>
      </section>

      <section className="section-x section-y border-y border-[color:var(--rule)] bg-[color:var(--surface-2)]">
        <div className="container-wide editorial-grid">
          <div className="editorial-aside">
            <p className="mono-label">I nostri valori</p>
            <h2 className="text-h2 text-ink mt-4">Cio che ci guida</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="care-card flex flex-col gap-4 p-6"
                >
                  <div className="flex size-10 items-center justify-center rounded-md bg-[color:var(--surface-2)] text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-h3 text-ink">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {v.copy}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-x section-y">
        <div className="container-wide editorial-grid">
          <div className="editorial-aside">
            <p className="mono-label">Certificazione</p>
            <h2 className="text-h2 text-ink mt-4">
              ARTOI, il nostro punto di partenza
            </h2>
          </div>
          <div className="space-y-4 text-base leading-relaxed text-ink-soft">
            <p>
              ARTOI (Associazione Ricerca Terapie Oncologiche Integrate)
              certifica medici formati nell&apos;integrazione tra cure
              oncologiche convenzionali, nutrizione e interventi complementari
              basati su evidenze scientifiche.
            </p>
            <p>
              Gli oncologi presenti su oncologo.it hanno la certificazione ARTOI
              come requisito minimo. È un filtro che garantisce formazione
              continua, approccio multidisciplinare e metodo scientifico.
            </p>
          </div>
        </div>
      </section>

      <section className="section-x section-y border-y border-[color:var(--rule)] bg-[color:var(--surface-2)]">
        <div className="container-wide">
          <div className="max-w-2xl">
            <p className="mono-label">Il team</p>
            <h2 className="text-h2 text-ink mt-4">Un team in crescita</h2>
          </div>
          <div className="care-card mt-10 p-10 text-sm text-muted-foreground">
            Stiamo costruendo una piattaforma pensata con pazienti, specialisti
            e ricercatori. I profili del team sono in arrivo: nel frattempo puoi
            scrivere a{" "}
            <a
              href="mailto:ciao@oncologo.it"
              className="font-medium text-ink underline underline-offset-4"
            >
              ciao@oncologo.it
            </a>
            .
          </div>
        </div>
      </section>

      <section className="section-x section-y-lg">
        <div className="accent-band container-narrow rounded-[1.25rem] p-10 text-center">
          <h2 className="text-h1 text-ink">Una domanda? Scrivici.</h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
            Siamo a disposizione per pazienti, specialisti e strutture
            interessate a collaborare.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="mailto:ciao@oncologo.it" className="btn-primary">
              ciao@oncologo.it
              <ArrowRight className="size-4" />
            </a>
            <Link href="/come-funziona" className="btn-secondary">
              Come funziona
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
