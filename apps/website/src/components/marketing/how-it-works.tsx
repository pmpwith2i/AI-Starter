import {
  AnimateIn,
  DisplayHeading,
  Marker,
  Section,
} from "@/components/design";
import { HOW_IT_WORKS_STEPS } from "./content";

interface HowItWorksProps {
  eyebrow?: string;
  heading?: React.ReactNode;
}

/**
 * Three-step path, written for decision clarity.
 */
export function HowItWorks({
  eyebrow = "Come funziona",
  heading = "Il percorso resta leggibile.",
}: HowItWorksProps) {
  return (
    <Section aria-labelledby="how-it-works-heading" divider="top">
      <div className="editorial-grid">
        <AnimateIn className="editorial-aside">
          <div className="flex flex-col gap-5">
            <p className="mono-label">{eyebrow}</p>
            <DisplayHeading id="how-it-works-heading" level="h2">
              {heading}
            </DisplayHeading>
            <p className="text-lede max-w-sm">
              Prima ti orienti, poi scegli. La conversione principale resta la
              prenotazione, ma ogni passo ti lascia spazio per capire.
            </p>
          </div>
        </AnimateIn>

        <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <AnimateIn key={step.n} delay={140 + i * 100} as="li">
              <div className="care-card flex h-full flex-col gap-4 p-6">
                <div className="flex items-baseline justify-between">
                  <Marker n={step.n} />
                  <span className="text-eyebrow text-muted-foreground">
                    {String(i + 1).padStart(2, "0")} /{" "}
                    {String(HOW_IT_WORKS_STEPS.length).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-h3 text-ink leading-snug">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.text}
                </p>
              </div>
            </AnimateIn>
          ))}
        </ol>
      </div>
    </Section>
  );
}
