/**
 * Shared status color class maps for badges and indicators.
 * Provides dark-mode-aware background + text colors for common statuses.
 */

import type { EventCategory } from "@repo/server-sdk";

/** Appointment / visit status colors — subtle opacity variant (professional table badges) */
export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  pending:
    "bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
  confirmed:
    "bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
  completed:
    "bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400",
  cancelled: "bg-destructive/10 text-destructive",
};

/** Visit type colors (prima_visita, controllo, follow_up, urgenza) */
export const VISIT_TYPE_COLORS: Record<string, string> = {
  prima_visita: "bg-blue-600 text-white hover:bg-blue-700",
  controllo:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  follow_up: "border-amber-400 text-amber-700 dark:text-amber-300",
  urgenza: "bg-destructive/10 text-destructive",
};

/** Nutrition plan status → badge variant */
export const NUTRITION_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline"
> = {
  creating: "secondary",
  ready: "default",
};

/** Visit type badge colors — solid 100/800 variant (detail view) */
export const VISIT_TYPE_BADGE: Record<string, string> = {
  prima_visita: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  controllo:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  follow_up:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  urgenza: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

/** Visit type badge colors — subtle opacity variant (professional table) */
export const VISIT_TYPE_BADGE_SUBTLE: Record<string, string> = {
  prima_visita:
    "bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
  controllo:
    "bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400",
  follow_up:
    "bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
  urgenza: "bg-destructive/10 text-destructive",
};

/** Event category colors — keyed by the EventCategory enum (lowercase). */
export const EVENT_CATEGORY_COLORS: Record<EventCategory, string> = {
  benessere:
    "bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400",
  supporto:
    "bg-violet-600/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400",
  nutrizione:
    "bg-orange-600/10 text-orange-600 dark:bg-orange-400/10 dark:text-orange-400",
};

/** Priority level colors */
export const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium:
    "bg-orange-600/10 text-orange-600 border-orange-600/20 dark:bg-orange-400/10 dark:text-orange-400 dark:border-orange-400/20",
  low: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/20",
};

/** Linked/unlinked patient status */
export const LINKED_STATUS_COLORS: Record<string, string> = {
  linked:
    "bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400",
  unlinked: "bg-muted text-muted-foreground",
};

/** Trend indicator colors */
export const TREND_COLORS: Record<string, string> = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-orange-600 dark:text-orange-400",
  stable: "text-muted-foreground",
};
