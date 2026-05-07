import Link from "next/link";
import { MailIcon, ShieldCheck } from "lucide-react";
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
    heading: "Resources",
    links: [
      { label: "How it works", href: "/come-funziona" },
      { label: "About", href: "/chi-siamo" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy-policy" },
      { label: "Terms", href: "/termini" },
      { label: "Cookies", href: "/cookie-policy" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="section-x border-t border-[color:var(--rule)] bg-[color:var(--surface)]">
      <div className="container-wide pt-24 pb-12">
        <div className="flex flex-col gap-4 border-b border-[color:var(--rule)] pb-16">
          <div className="text-eyebrow text-muted-foreground flex items-center gap-3">
            <RingMark size={4} className="text-primary" />
            <span>Type-cascade starter</span>
          </div>
          <p className="text-h1 text-ink max-w-[18ch]">
            Starter<span className="text-primary">.</span>
          </p>
        </div>

        <div className="grid gap-12 pt-16 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Replace this paragraph and the columns below with copy specific to
              your project (the design-system-agent will do this after the
              interview).
            </p>
            <div className="mt-2 inline-flex w-fit items-center gap-2 rounded-md border border-[color:var(--rule)] bg-background px-3 py-1.5 text-eyebrow">
              <ShieldCheck className="size-3 text-primary" />
              GDPR-ready
            </div>
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

        <div className="mt-20 flex flex-col items-start gap-6 border-t border-[color:var(--rule)] pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-caption">
            &copy; {year} Starter. All rights reserved.
          </p>
          <nav aria-label="Social" className="flex items-center gap-5">
            <a
              href="mailto:hello@example.com"
              aria-label="Email"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <MailIcon className="size-4" />
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
