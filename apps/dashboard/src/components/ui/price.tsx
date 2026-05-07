import type { ReactNode } from "react";
import { Trans } from "@lingui/react/macro";
import { cn } from "@/lib/utils";
import { formatPriceEur } from "@/lib/pricing/format-price";

interface PriceProps {
  /**
   * Amount in integer cents. `null` or `undefined` is rendered as the
   * free-tier label (default: `Gratuito`).
   */
  priceEurCents: number | null | undefined;
  /** ISO 4217 currency code. Defaults to `EUR`. */
  currency?: string;
  className?: string;
  /** Override for the free-tier label. Defaults to `<Trans>Gratuito</Trans>`. */
  freeLabel?: ReactNode;
}

/**
 * Canonical price renderer used by events, courses, and bundles.
 *
 * - Numeric amounts are formatted via `formatPriceEur` (Italian locale,
 *   whole-euro amounts without decimals).
 * - `null`/`undefined` prices render "Gratuito" (i18n-wrapped) or a custom
 *   `freeLabel` when the call site wants a different copy.
 */
export function Price({
  priceEurCents,
  currency = "EUR",
  className,
  freeLabel,
}: PriceProps) {
  if (priceEurCents == null) {
    return (
      <span className={cn(className)}>
        {freeLabel ?? <Trans>Gratuito</Trans>}
      </span>
    );
  }
  return (
    <span className={cn(className)}>
      {formatPriceEur(priceEurCents, currency)}
    </span>
  );
}
