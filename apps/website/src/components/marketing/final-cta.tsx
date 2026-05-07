import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { DASHBOARD_URL } from "@/lib/api";
import { AnimateIn, Section } from "@/components/design";

/**
 * Final CTA, confident without urgency theatre.
 */
export function FinalCta() {
  return (
    <Section pad="none" tone="paper" className="py-0">
      <AnimateIn>
        <div className="accent-band rounded-[1.25rem] px-6 py-20 text-ink sm:px-12 lg:px-16 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <p className="mono-label text-primary">Inizia oggi</p>
              <h2 className="text-h1 mt-5 leading-tight max-w-[20ch]">
                Prendi la prima decisione, senza sentirti spinto.
              </h2>
              <p className="text-lede mt-6 max-w-lg">
                Sfoglia gli specialisti certificati, leggi le biografie,
                confronta sedi e disponibilità. La registrazione è gratuita.
              </p>
            </div>

            <div className="lg:col-span-5 lg:flex lg:flex-col lg:items-end lg:justify-end">
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
                <Link href="/specialisti" className="btn-primary">
                  Cerca uno specialista
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
                <a href={`${DASHBOARD_URL}/signup`} className="btn-secondary">
                  Registrati gratis
                </a>
              </div>
              <p className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" aria-hidden />
                Nessun obbligo, nessuna carta di credito richiesta.
              </p>
            </div>
          </div>
        </div>
      </AnimateIn>
    </Section>
  );
}
