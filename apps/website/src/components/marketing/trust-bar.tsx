import { CREDENTIALS } from "./content";

/**
 * Trust strip, practical proof before the visitor scrolls.
 */
export function TrustBar() {
  return (
    <section
      aria-label="Riconosciuti da"
      className="section-x border-y border-[color:var(--rule)] bg-[color:var(--surface-2)]"
    >
      <div className="container-wide grid gap-4 py-5 md:flex md:flex-nowrap md:items-center md:gap-x-6">
        <p className="text-eyebrow shrink-0">Fiducia prima di tutto</p>
        <span
          aria-hidden
          className="hidden h-3 w-px bg-[color:var(--rule)] md:inline-block"
        />
        <ul className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-5 md:flex md:flex-wrap md:items-center md:gap-x-6">
          {CREDENTIALS.map((c, i) => (
            <li key={c.name} className="flex items-center gap-x-6">
              <span
                className="text-[0.72rem] font-extrabold uppercase tracking-[0.06em] text-ink-soft md:text-[0.78rem] md:tracking-[0.08em]"
                title={c.detail}
              >
                {c.name}
              </span>
              {i < CREDENTIALS.length - 1 ? (
                <span
                  aria-hidden
                  className="hidden h-3 w-px bg-[color:var(--rule)] md:inline-block"
                />
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
