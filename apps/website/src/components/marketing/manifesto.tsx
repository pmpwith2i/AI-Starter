import { AnimateIn, Section } from "@/components/design";

/**
 * Manifesto, emotional anchor without pressure.
 */
export function Manifesto() {
  return (
    <Section aria-labelledby="manifesto-heading" tone="alt" divider="both">
      <div className="editorial-grid">
        <AnimateIn className="editorial-aside">
          <div className="flex flex-col gap-5">
            <p className="mono-label">Perché esistiamo</p>
            <span
              className="block h-px w-12 bg-[color:var(--ink)]"
              aria-hidden
            />
            <p className="text-sm leading-relaxed text-muted-foreground max-w-[26ch]">
              Una piattaforma costruita con oncologi, nutrizionisti e pazienti,
              non per loro.
            </p>
          </div>
        </AnimateIn>

        <AnimateIn delay={140}>
          <h2 id="manifesto-heading" className="text-h1 text-ink max-w-[22ch]">
            La cura non è un appuntamento. È una rotta da tenere.
          </h2>

          <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-12">
            <p className="text-lede max-w-md">
              Quando arriva una diagnosi, il tempo cambia forma. Servono
              risposte rapide, ma anche presenza nelle ore difficili: quando lo
              specialista non c&apos;è, quando il piano nutrizionale non torna,
              quando l&apos;ansia decide di farsi viva alle tre di notte.
            </p>
            <p className="text-lede max-w-md">
              Abbiamo costruito oncologo.it per quelle ore. Specialisti
              certificati con disponibilità reali, piani nutrizionali
              personalizzati per la tua terapia e un assistente AI che risponde
              con misura. Tutto integrato, perché la cura è una sola.
            </p>
          </div>

          <footer className="mt-12 flex items-center gap-4 border-t border-[color:var(--rule)] pt-6">
            <span
              aria-hidden
              className="flex size-11 items-center justify-center rounded-md bg-[color:var(--surface)] text-sm font-semibold text-ink"
            >
              MR
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Dott. Marco Riva</p>
              <p className="text-caption">
                Oncologo, co-fondatore di oncologo.it
              </p>
            </div>
          </footer>
        </AnimateIn>
      </div>
    </Section>
  );
}
