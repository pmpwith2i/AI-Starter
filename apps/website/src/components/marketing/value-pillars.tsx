import { AnimateIn, DisplayHeading, Section } from "@/components/design";
import { VALUE_PILLARS } from "./content";

/**
 * Three promises, shown as operational guarantees.
 */
export function ValuePillars() {
  return (
    <Section
      aria-labelledby="value-pillars-heading"
      tone="alt"
      divider="bottom"
    >
      <div className="editorial-grid">
        <AnimateIn className="editorial-aside">
          <div className="flex flex-col gap-5">
            <p className="mono-label">Garanzie operative</p>
            <DisplayHeading id="value-pillars-heading" level="h2">
              Tre cose che devono funzionare sempre.
            </DisplayHeading>
            <p className="text-lede max-w-sm">
              Se una piattaforma sanitaria chiede fiducia, deve prima mostrare
              metodo: verifiche chiare, disponibilità reali, dati trattati con
              rispetto.
            </p>
          </div>
        </AnimateIn>

        <ul className="grid gap-4 sm:grid-cols-3">
          {VALUE_PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <AnimateIn
                key={pillar.title}
                delay={i * 100}
                as="li"
                className="care-card"
              >
                <article className="flex h-full flex-col gap-5 p-7 sm:p-8">
                  <header className="flex items-center justify-between">
                    <span className="text-eyebrow numerals text-primary">
                      {String(i + 1).padStart(2, "0")} / 03
                    </span>
                    <Icon className="size-5 text-primary" aria-hidden />
                  </header>

                  <h3 className="text-h3 text-ink leading-snug max-w-[18ch]">
                    {pillar.title}
                  </h3>

                  <p className="text-base leading-relaxed text-ink-soft">
                    {pillar.copy}
                  </p>

                  <p className="text-sm leading-relaxed text-muted-foreground mt-auto">
                    {pillar.detail}
                  </p>
                </article>
              </AnimateIn>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
