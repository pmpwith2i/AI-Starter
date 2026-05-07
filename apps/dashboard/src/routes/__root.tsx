import { ThemeProvider } from "@/components/theme-provider";
import { queryClient } from "@/lib/api/query-client";
import { AuthProvider } from "@/lib/auth";
import { i18n } from "@/lib/i18n";
import { I18nProvider } from "@lingui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";

import "../styles.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlobalErrorPage } from "@/components/errors/global-error-page";

/**
 * Router context contract — every loader receives `{ queryClient }`
 * via `ctx.context`. Loaders use `queryClient.ensureQueryData(...)`
 * to pre-fill the React Query cache so that the corresponding
 * `useQuery` hook in the component renders immediately on mount.
 */
export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: GlobalErrorPage,
});

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="oncologo-ui-theme">
      <TooltipProvider>
        <I18nProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <Outlet />
              <Toaster position="top-right" richColors closeButton />
            </AuthProvider>
          </QueryClientProvider>
        </I18nProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
