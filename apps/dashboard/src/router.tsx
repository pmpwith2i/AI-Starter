import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { GlobalNotFound } from "./components/global-not-found";
import { GlobalErrorPage } from "./components/errors/global-error-page";
import { queryClient } from "./lib/api/query-client";

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    scrollToTopSelectors: ["body"],
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: GlobalNotFound,
    defaultErrorComponent: GlobalErrorPage,
    notFoundMode: "fuzzy",
    // Loaders receive `{ queryClient }` via `ctx.context` so they can
    // call `ensureQueryData` and prefill the React Query cache.
    context: { queryClient },
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
