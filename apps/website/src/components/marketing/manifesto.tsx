import { AnimateIn, Section } from "@/components/design";

/**
 * Manifesto — placeholder emotional anchor section. Replace the copy with
 * your own brand voice; the design-system-agent will rewrite this after the
 * interview.
 */
export function Manifesto() {
  return (
    <Section aria-labelledby="manifesto-heading" tone="alt" divider="both">
      <div className="editorial-grid">
        <AnimateIn className="editorial-aside">
          <div className="flex flex-col gap-5">
            <p className="mono-label">Why we exist</p>
            <span
              className="block h-px w-12 bg-[color:var(--ink)]"
              aria-hidden
            />
            <p className="text-sm leading-relaxed text-muted-foreground max-w-[26ch]">
              Replace this aside with the one-line voice of your brand.
            </p>
          </div>
        </AnimateIn>

        <AnimateIn delay={140}>
          <h2 id="manifesto-heading" className="text-h1 text-ink max-w-[22ch]">
            Replace this headline with the heart of your manifesto.
          </h2>

          <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-12">
            <p className="text-lede max-w-md">
              Replace this paragraph with the first half of your manifesto.
            </p>
            <p className="text-lede max-w-md">
              {`{{PROJECT_NAME}}`} is the platform that handles the second half.
              Replace this paragraph with the closing argument.
            </p>
          </div>

          <footer className="mt-12 flex items-center gap-4 border-t border-[color:var(--rule)] pt-6">
            <span
              aria-hidden
              className="flex size-11 items-center justify-center rounded-md bg-[color:var(--surface)] text-sm font-semibold text-ink"
            >
              ★
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Replace name</p>
              <p className="text-caption">
                Replace title — co-founder, {`{{PROJECT_NAME}}`}
              </p>
            </div>
          </footer>
        </AnimateIn>
      </div>
    </Section>
  );
}
