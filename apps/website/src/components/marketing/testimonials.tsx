import { Star } from "lucide-react";
import { AnimateIn, DisplayHeading, Section } from "@/components/design";
import { HOMEPAGE_TESTIMONIALS, type Testimonial } from "./content";

interface TestimonialsProps {
  testimonials?: readonly Testimonial[];
}

const initialsFor = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/**
 * Patient voices, anonymised and practical.
 */
export function Testimonials({
  testimonials = HOMEPAGE_TESTIMONIALS,
}: TestimonialsProps) {
  return (
    <Section aria-labelledby="testimonials-heading" tone="alt" divider="both">
      <div className="editorial-grid">
        <AnimateIn className="editorial-aside">
          <div className="flex flex-col gap-5">
            <p className="mono-label">Voci dei pazienti</p>
            <DisplayHeading id="testimonials-heading" level="h2">
              Le persone cercano soprattutto sollievo dal caos.
            </DisplayHeading>
            <div className="flex items-center gap-3 border-t border-[color:var(--rule)] pt-5">
              <span className="star-rail" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-3.5 fill-current"
                    strokeWidth={0}
                  />
                ))}
              </span>
              <p className="text-sm text-ink">
                <span className="numerals font-semibold mr-1">4,8</span>
                <span className="text-muted-foreground">
                  media su 247 recensioni
                </span>
              </p>
            </div>
          </div>
        </AnimateIn>

        <ul className="grid gap-5 md:grid-cols-3 md:gap-4">
          {testimonials.map((t, i) => (
            <AnimateIn key={t.name} delay={i * 100} as="li">
              <article className="care-card flex h-full flex-col gap-5 p-6">
                <header className="flex items-center justify-between">
                  <span className="star-rail" aria-hidden>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className="size-3 fill-primary text-primary"
                        strokeWidth={0}
                      />
                    ))}
                  </span>
                  <span className="text-eyebrow">{t.treatment}</span>
                </header>

                <blockquote className="text-[1.0625rem] leading-[1.55] text-ink flex-1">
                  {t.text}
                </blockquote>

                <footer className="flex items-center gap-3 border-t border-[color:var(--rule)] pt-5">
                  <span
                    aria-hidden
                    className="flex size-10 items-center justify-center rounded-md bg-[color:var(--surface-2)] text-xs font-semibold text-ink"
                  >
                    {initialsFor(t.name)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{t.name}</p>
                    <p className="text-caption">
                      {t.detail}, {t.city}
                    </p>
                  </div>
                </footer>
              </article>
            </AnimateIn>
          ))}
        </ul>
      </div>
    </Section>
  );
}
