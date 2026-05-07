import { Trans } from "@lingui/react/macro";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

import type { LegalDocumentResponse } from "@repo/server-sdk";

interface LegalDocumentProps {
  title: React.ReactNode;
  data: LegalDocumentResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  /** Where to go when the user presses the back link. Defaults to login. */
  backTo?: string;
  backLabel?: React.ReactNode;
}

/**
 * Generic renderer for a legal document fetched from the server. Intentionally
 * dumb — the page component supplies the hook data. Content is rendered as
 * pre-wrap text so the placeholder copy shows cleanly; swap to a markdown
 * renderer once the final legal copy is in place.
 */
export function LegalDocument({
  title,
  data,
  isLoading,
  isError,
  onRetry,
  backTo = "/login",
  backLabel,
}: LegalDocumentProps) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
        <Link
          to={backTo}
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          {backLabel ?? <Trans>Indietro</Trans>}
        </Link>

        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {data ? (
            <p className="text-sm text-muted-foreground">
              <Trans>Versione</Trans> {data.version} ·{" "}
              <Trans>ultimo aggiornamento</Trans>{" "}
              {new Date(data.updatedAt).toLocaleDateString("it-IT")}
            </p>
          ) : null}
        </header>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <Trans>Caricamento documento…</Trans>
          </div>
        ) : isError ? (
          <div className="space-y-3">
            <p className="text-destructive">
              <Trans>
                Si è verificato un errore nel caricamento del documento.
              </Trans>
            </p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="text-sm font-medium text-primary hover:underline"
              >
                <Trans>Riprova</Trans>
              </button>
            ) : null}
          </div>
        ) : data ? (
          <article className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {data.content}
          </article>
        ) : null}
      </div>
    </div>
  );
}
