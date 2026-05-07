import Link from "next/link";
import { InstagramIcon, Linkedin, MailIcon, ShieldCheck } from "lucide-react";
import { SPECIALTIES, SPECIALTY_LABELS } from "@repo/server-sdk/schemas";
import { RingMark } from "@/components/design/ring-mark";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterColumn {
  heading: string;
  links: readonly FooterLink[];
}

const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    heading: "Piattaforma",
    links: [
      { label: "Specialisti", href: "/specialisti" },
      { label: "Corsi", href: "/corsi" },
      { label: "Eventi", href: "/eventi" },
      { label: "Pacchetti", href: "/eventi/pacchetti" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    heading: "Risorse",
    links: [
      { label: "Come funziona", href: "/come-funziona" },
      { label: "Chi siamo", href: "/chi-siamo" },
    ],
  },
  {
    heading: "Legale",
    links: [
      { label: "Privacy", href: "/privacy-policy" },
      { label: "Termini", href: "/termini" },
      { label: "Cookie", href: "/cookie-policy" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="section-x border-t border-[color:var(--rule)] bg-[color:var(--surface)]">
      <div className="container-wide pt-24 pb-12">
        {/* Masthead — large display "oncologo.it" + tagline */}
        <div className="flex flex-col gap-4 border-b border-[color:var(--rule)] pb-16">
          <div className="text-eyebrow text-muted-foreground flex items-center gap-3">
            <RingMark size={4} className="text-primary" />
            <span>La piattaforma dei pazienti oncologici</span>
          </div>
          <p className="text-h1 text-ink max-w-[18ch]">
            oncologo<span className="text-primary">.</span>it
          </p>
        </div>

        {/* Link columns */}
        <div className="grid gap-12 pt-16 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Specialisti certificati, nutrizione AI, corsi ed eventi. Pensato
              per accompagnarti passo dopo passo nel tuo percorso di cura.
            </p>
            <div className="mt-2 inline-flex w-fit items-center gap-2 rounded-md border border-[color:var(--rule)] bg-background px-3 py-1.5 text-eyebrow">
              <ShieldCheck className="size-3 text-primary" />
              Certificato ARTOI
            </div>
          </div>

          <div>
            <h2 className="text-eyebrow text-foreground">Specialisti</h2>
            <ul className="mt-5 flex flex-col gap-3 text-sm text-muted-foreground">
              {SPECIALTIES.map((s) => (
                <li key={s}>
                  <Link
                    href={`/specialisti/${s}`}
                    className="link-swipe transition-colors hover:text-foreground"
                  >
                    {SPECIALTY_LABELS[s]}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/specialisti"
                  className="link-swipe transition-colors hover:text-foreground"
                >
                  Tutti
                </Link>
              </li>
            </ul>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h2 className="text-eyebrow text-foreground">{col.heading}</h2>
              <ul className="mt-5 flex flex-col gap-3 text-sm text-muted-foreground">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="link-swipe transition-colors hover:text-foreground"
                      {...(link.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-20 flex flex-col items-start gap-6 border-t border-[color:var(--rule)] pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-caption">
            &copy; {year} METAIMED S.r.l. Tutti i diritti riservati.
          </p>
          <nav aria-label="Social" className="flex items-center gap-5">
            <a
              href="mailto:ciao@oncologo.it"
              aria-label="Email"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <MailIcon className="size-4" />
            </a>
            <a
              href="https://instagram.com/oncologo.it"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <InstagramIcon className="size-4" />
            </a>
            <a
              href="https://www.linkedin.com/company/oncologo-it"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Linkedin className="size-4" />
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
