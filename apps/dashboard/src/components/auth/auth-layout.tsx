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
            {`{{PROJECT_NAME}}`}
          </a>
          <h1 className="mt-12 text-3xl font-bold leading-tight xl:text-4xl">
            <Trans>{`{{TAGLINE}}`}</Trans>
          </h1>
          <p className="mt-6 text-lg text-primary-foreground/80">
            <Trans>{`{{ONE_LINER}}`}</Trans>
          </p>
        </div>

        <p className="text-sm text-primary-foreground/70">
          <Trans>&copy; {`{{COMPANY_NAME}}`} — All rights reserved</Trans>
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
              {`{{PROJECT_NAME}}`}
            </a>
          </div>

          {children}
          <AuthFooter />
        </div>
      </div>
    </div>
  );
}
