import { createApiSDK, setAccessTokenProvider } from "@repo/server-sdk";
import type { ApiSDK } from "@repo/server-sdk";

import { getCachedAccessToken } from "../auth/secure-store";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export const sdk: ApiSDK = createApiSDK(API_BASE_URL);

setAccessTokenProvider(() => getCachedAccessToken() ?? undefined);
