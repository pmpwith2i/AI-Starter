import { createApiSDK, setAccessTokenProvider } from "@repo/server-sdk";
import { ApiError } from "@repo/server-sdk";
import type { ApiSDK } from "@repo/server-sdk";

const INDICATOR_COOKIE = "oncologo_logged_in";
const LS_ACCESS_TOKEN = "oncologo_access_token";
const LS_REFRESH_TOKEN = "oncologo_refresh_token";

/**
 * Auth strategy: "cookie" (default, production) or "bearer" (Vercel preview deployments).
 * In bearer mode, tokens are stored in localStorage and sent as Authorization headers.
 */
export type AuthStrategy = "cookie" | "bearer";
export const AUTH_STRATEGY: AuthStrategy =
  (import.meta.env.VITE_AUTH_STRATEGY as AuthStrategy | undefined) || "cookie";
const isBearerMode = AUTH_STRATEGY === "bearer";

/**
 * Single source of truth for the API base URL.
 * All HTTP, SSE, and WebSocket connections derive from this.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ---------------------------------------------------------------------------
// Token storage helpers (bearer mode only)
// ---------------------------------------------------------------------------

export const storeTokens = (
  accessToken: string,
  refreshToken: string,
): void => {
  localStorage.setItem(LS_ACCESS_TOKEN, accessToken);
  localStorage.setItem(LS_REFRESH_TOKEN, refreshToken);
};

export const getStoredAccessToken = (): string | null =>
  localStorage.getItem(LS_ACCESS_TOKEN);

export const getStoredRefreshToken = (): string | null =>
  localStorage.getItem(LS_REFRESH_TOKEN);

export const clearStoredTokens = (): void => {
  localStorage.removeItem(LS_ACCESS_TOKEN);
  localStorage.removeItem(LS_REFRESH_TOKEN);
};

// ---------------------------------------------------------------------------
// SDK instance
// ---------------------------------------------------------------------------

/**
 * Singleton SDK instance.
 * In cookie mode: auth transport uses httpOnly cookies via `credentials: "include"`.
 * In bearer mode: global token provider injects stored access token on every request.
 */
export const sdk: ApiSDK = createApiSDK(API_BASE_URL);

// In bearer mode, register the global token provider so every SDK call
// automatically attaches the stored access token as a Bearer header.
if (isBearerMode) {
  setAccessTokenProvider(() => getStoredAccessToken() ?? undefined);
}

// ---------------------------------------------------------------------------
// Auth state helpers
// ---------------------------------------------------------------------------

/**
 * Check if the user appears logged in.
 * - Cookie mode: reads the non-httpOnly indicator cookie.
 * - Bearer mode: checks localStorage for a stored access token.
 */
export const isLoggedIn = (): boolean => {
  if (isBearerMode) {
    return getStoredAccessToken() !== null;
  }
  return document.cookie.split(";").some((c) => {
    const [key, val] = c.trim().split("=");
    return key === INDICATOR_COOKIE && val === "1";
  });
};

/**
 * Returns the access token for SDK calls that need an explicit token (e.g. SSE, WebSocket).
 * - Cookie mode: returns undefined (cookies are sent automatically).
 * - Bearer mode: returns the stored access token.
 */
export const getAccessToken = (): string | undefined =>
  isBearerMode ? (getStoredAccessToken() ?? undefined) : undefined;

/**
 * Attempts to refresh the access token.
 * - Cookie mode: refresh token cookie is sent automatically via credentials: "include".
 * - Bearer mode: sends the stored refresh token in the request body and stores new tokens.
 *
 * On failure, dispatches an `auth:session-expired` window event so the
 * AuthProvider can reset state via React Router. We deliberately avoid
 * `window.location.href = …` here: a hard reload caused an infinite loop
 * when a query on `/app` fired during the public auth-page transition.
 */
export const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired";

let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = isBearerMode ? (getStoredRefreshToken() ?? "") : "";
      const res = await sdk.auth.refresh({ refreshToken });
      if (isBearerMode) {
        storeTokens(res.accessToken, res.refreshToken);
      }
      return res.accessToken;
    } catch {
      if (isBearerMode) {
        clearStoredTokens();
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Returns true if the error is a 401 that should trigger a token refresh.
 */
export const isUnauthorizedError = (error: unknown): boolean =>
  error instanceof ApiError && error.statusCode === 401;
