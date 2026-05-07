"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MenuIcon, Search, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isLoggedIn } from "@/lib/auth";
import { RingMark } from "@/components/design/ring-mark";

const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:5173";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Specialisti", href: "/specialisti" },
  { label: "Corsi", href: "/corsi" },
  { label: "Eventi", href: "/eventi" },
  { label: "Blog", href: "/blog" },
  { label: "Come funziona", href: "/come-funziona" },
  { label: "Chi siamo", href: "/chi-siamo" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- need client-only cookie check
    setLoggedIn(isLoggedIn());
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-[color:var(--rule)] bg-background/86 backdrop-blur-xl"
          : "bg-background/50 backdrop-blur-sm",
      )}
    >
      <div className="container-wide section-x flex h-18 items-center justify-between gap-6">
        <Link
          href="/"
          className="group flex items-center gap-3 text-ink"
          aria-label="Torna alla home"
        >
          <RingMark
            size={7}
            className="text-primary transition-transform duration-500 group-hover:rotate-45"
          />
          <span className="text-[1.15rem] font-extrabold tracking-normal">
            {`{{PROJECT_NAME}}`}
            <span className="text-primary">.</span>
          </span>
        </Link>

        <nav
          aria-label="Principale"
          className="hidden items-center gap-8 lg:flex"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          {loggedIn ? (
            <a href={DASHBOARD_URL} className="btn-primary">
              Dashboard
              <ArrowRight className="size-3.5" />
            </a>
          ) : (
            <>
              <a
                href={`${DASHBOARD_URL}/login`}
                className="text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Accedi
              </a>
              <Link href="/specialisti" className="btn-secondary py-2.5">
                <Search className="size-3.5" />
                Trova specialista
              </Link>
              <a href={`${DASHBOARD_URL}/signup`} className="btn-primary">
                Registrati
              </a>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Apri menu"
          aria-expanded={mobileOpen}
          className="inline-flex size-10 items-center justify-center rounded-full border border-[color:var(--rule)] bg-[color:var(--surface)] text-foreground transition-colors hover:bg-background lg:hidden"
        >
          {mobileOpen ? (
            <XIcon className="size-4" />
          ) : (
            <MenuIcon className="size-4" />
          )}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-[color:var(--rule)] bg-background section-x py-6 lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-[color:var(--rule)] py-4 text-[15px] text-foreground transition-colors hover:text-primary"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-2">
            {loggedIn ? (
              <a
                href={DASHBOARD_URL}
                className="btn-primary w-full justify-center"
              >
                Dashboard
                <ArrowRight className="size-3.5" />
              </a>
            ) : (
              <>
                <a
                  href={`${DASHBOARD_URL}/login`}
                  className="btn-secondary w-full justify-center"
                >
                  Accedi
                </a>
                <a
                  href={`${DASHBOARD_URL}/signup`}
                  className="btn-primary w-full justify-center"
                >
                  Registrati
                </a>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
