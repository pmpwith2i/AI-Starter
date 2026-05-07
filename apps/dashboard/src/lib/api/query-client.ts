import { QueryClient } from "@tanstack/react-query";
import { isUnauthorizedError, refreshAccessToken } from "./client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: (failureCount, error) => {
        // On 401, attempt a single token refresh then retry
        if (failureCount === 0 && isUnauthorizedError(error)) {
          void refreshAccessToken();
          return true;
        }
        // Default: retry once for other errors
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: (failureCount, error) => {
        // On 401, attempt a single token refresh then retry
        if (failureCount === 0 && isUnauthorizedError(error)) {
          void refreshAccessToken();
          return true;
        }
        return false;
      },
    },
  },
});
