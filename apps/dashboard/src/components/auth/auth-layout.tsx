import { Trans } from "@lingui/react/macro";
import { AuthFooter } from "./auth-footer";

const MARKETING_URL =
  import.meta.env.VITE_MARKETING_URL || "http://localhost:3001";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="flex flex-col items-center justify-between gap-12 bg-primary p-10 max-lg:hidden xl:p-16">
        <div className="w-full max-w-md text-primary-foreground">
          <a
            href={MARKETING_URL}
            className="font-display text-2xl font-semibold tracking-tight"
          >
            oncologo.it
          </a>
          <h1 className="mt-12 text-3xl font-bold leading-tight xl:text-4xl">
            <Trans>Il tuo percorso di cura, sempre a portata di mano.</Trans>
          </h1>
          <p className="mt-6 text-lg text-primary-foreground/80">
            <Trans>
              Accedi per gestire appuntamenti, piani nutrizionali, corsi ed
              eventi del tuo percorso di benessere.
            </Trans>
          </p>
        </div>

        <ul className="grid w-full max-w-md gap-4 text-primary-foreground/90">
          <li className="flex items-start gap-3">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary-foreground" />
            <span>
              <Trans>
                Piani nutrizionali personalizzati e aggiornati in tempo reale
              </Trans>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary-foreground" />
            <span>
              <Trans>
                Specialisti verificati e prenotazione visite in pochi click
              </Trans>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary-foreground" />
            <span>
              <Trans>
                Corsi, eventi e contenuti curati per il tuo benessere
              </Trans>
            </span>
          </li>
        </ul>

        <p className="text-sm text-primary-foreground/70">
          <Trans>&copy; oncologo.it — Tutti i diritti riservati</Trans>
        </p>
      </div>

      {/* Form panel */}
      <div className="flex h-full flex-col items-center justify-center px-6 py-10 sm:px-10">
        <div className="flex w-full max-w-md flex-col gap-8">
          <div className="space-y-2 text-center lg:hidden">
            <a
              href={MARKETING_URL}
              className="font-display text-xl font-semibold"
            >
              oncologo.it
            </a>
          </div>

          {children}
          <AuthFooter />
        </div>
      </div>
    </div>
  );
}
