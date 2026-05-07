import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@lingui/react";
import type { Preview } from "@storybook/react-vite";
import { ThemeProvider } from "../src/components/theme-provider";
import { i18n } from "../src/lib/i18n";
import "../src/styles.css";
import {
  createRouter,
  RouterProvider,
  createRootRoute,
} from "@tanstack/react-router";

const rootRoute = createRootRoute();
const router = createRouter({
  routeTree: rootRoute.addChildren([]),
});

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: Infinity },
        },
      });

      return (
        <QueryClientProvider client={queryClient}>
          <RouterProvider
            router={router}
            defaultComponent={() => (
              <ThemeProvider defaultTheme="light">
                <I18nProvider i18n={i18n}>
                  <Story />
                </I18nProvider>
              </ThemeProvider>
            )}
          />
        </QueryClientProvider>
      );
    },
  ],
};

export default preview;
