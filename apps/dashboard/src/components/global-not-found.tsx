import { NotFoundPage } from "@/components/not-found-page";

/**
 * Wrapper used as the router-level `defaultNotFoundComponent`. The
 * underlying `NotFoundPage` accepts optional resource-specific props
 * (used by individual detail routes), but TanStack Router passes its
 * own `NotFoundRouteProps` shape to the default component — we ignore
 * those and render the generic 404.
 *
 * Lives in its own file because Vite's react-refresh enforces that a
 * file containing a component cannot also export non-component values
 * (the router config used to live alongside this and tripped the rule).
 */
export function GlobalNotFound() {
  return <NotFoundPage />;
}
