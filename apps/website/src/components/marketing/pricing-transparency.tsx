import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { AnimateIn, DisplayHeading, Section } from "@/components/design";
import { PRICING_TIERS } from "./content";

/**
 * Transparent pricing, placed before the late-stage objection.
 */
export function PricingTransparency() {
  return (
    <Section aria-labelledby="pricing-heading" divider="top">
      <div className="editorial-grid">
        <AnimateIn className="editorial-aside">
          <div className="flex flex-col gap-5">
            <p className="mono-label">Tariffe trasparenti</p>
            <DisplayHeading id="pricing-heading" level="h2">
              Il costo non arriva alla fine.
            </DisplayHeading>
            <p className="text-lede max-w-md">
              Il prezzo della visita lo decide ogni specialista ed è visibile
              prima di prenotare. La piattaforma resta gratuita.
            </p>
            <p className="inline-flex items-center gap-2 text-sm text-ink-soft">
              <ShieldCheck className="size-4 text-primary" aria-hidden />
              Nessuna commissione nascosta
            </p>
          </div>
        </AnimateIn>

        <AnimateIn delay={140}>
          <ul className="border-y border-[color:var(--rule)]">
            {PRICING_TIERS.map((tier) => (
              <li
                key={tier.title}
                className="grid grid-cols-[1fr_auto] gap-x-8 gap-y-2 border-b border-[color:var(--rule)] py-6 last:border-b-0 md:grid-cols-[1.6fr_1fr_auto]"
              >
                <div>
                  <h3 className="text-h3 text-ink">{tier.title}</h3>
                  <p className="text-caption mt-1.5 max-w-md md:hidden">
                    {tier.detail}
                  </p>
                </div>
                <p className="text-caption hidden self-center md:block">
                  {tier.detail}
                </p>
                <div className="col-span-2 flex items-baseline justify-between gap-6 md:col-span-1 md:justify-end">
                  <span className="text-eyebrow numerals md:hidden">
                    {tier.duration}
                  </span>
                  <p className="numerals text-ink whitespace-nowrap text-[1.375rem] font-semibold leading-none tracking-normal md:text-[1.5rem]">
                    {tier.range}
                  </p>
                </div>
                <p className="text-eyebrow numerals hidden self-center text-right md:block">
                  {tier.duration}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-caption max-w-sm">
              Range indicativi. Il prezzo definitivo è visibile sul profilo
              dello specialista, prima della conferma.
            </p>
            <Link
              href="/specialisti"
              className="link-swipe inline-flex items-center gap-2 text-sm font-medium text-ink"
            >
              Vedi tariffe per specialista
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </AnimateIn>
      </div>
    </Section>
  );
}
