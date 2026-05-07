import { ApiError } from "./error.js";
import type { ApiErrorBody } from "./error.js";

/**
 * Global access-token provider. When set, called on every request that has no
 * explicit `accessToken` option. Used by the patient dashboard in "bearer" auth
 * mode (Vercel preview deployments where cross-site cookies don't work).
 */
let _accessTokenProvider: (() => string | undefined) | null = null;

/**
 * Register a global token provider. The fetcher calls this on every request
 * when no explicit `accessToken` is passed.
 */
export const setAccessTokenProvider = (
  fn: (() => string | undefined) | null,
): void => {
  _accessTokenProvider = fn;
};

/**
 * Resolve the effective access token: explicit param > global provider > undefined.
 * Exported so raw-fetch call sites (e.g. uploadAvatar) can reuse the same logic.
 */
export const getEffectiveAccessToken = (
  explicit?: string,
): string | undefined => explicit ?? _accessTokenProvider?.() ?? undefined;

/**
 * Admin auth provider — separate from the user-facing access-token provider.
 * The admin dashboard registers a function that returns the headers required
 * to authenticate against `/admin/*` endpoints. Today: `{ "X-Admin-Secret": ... }`.
 * In a future PR (basic-auth, cookie session, OAuth), only this provider's
 * implementation changes — every call site keeps using `useAdminAuth: true`.
 *
 * `null` return means "no admin credentials registered" → the fetcher will
 * still issue the request (the server will reject it), so callers can rely on
 * normal HTTP error flow rather than an extra runtime check.
 */
let _adminAuthProvider: (() => Record<string, string> | null) | null = null;

export const setAdminAuthProvider = (
  fn: (() => Record<string, string> | null) | null,
): void => {
  _adminAuthProvider = fn;
};

const getAdminAuthHeaders = (): Record<string, string> | null =>
  _adminAuthProvider?.() ?? null;

/**
 * Returns the auth headers to attach to a raw fetch call. Used by call sites
 * that bypass `apiFetch` because the response is non-JSON (CSV download,
 * binary, etc.) or the request body is multipart.
 *
 * - `mode === "admin"` → admin headers (or `{}` if no provider registered)
 * - `mode === "user"`  → `Authorization: Bearer <token>` if a token is
 *   available; otherwise the empty object so the browser falls back to
 *   cookie auth via `credentials: "include"`.
 */
export const getAuthFor = (mode: "admin" | "user"): Record<string, string> => {
  if (mode === "admin") return getAdminAuthHeaders() ?? {};
  const token = getEffectiveAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface FetchOptions<TBody> {
  baseUrl: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: TBody;
  /**
   * When provided, sent as `Authorization: Bearer <token>` (server-to-server calls).
   * When omitted, falls back to the global token provider, then to `credentials: "include"` (browser cookie auth).
   */
  accessToken?: string;
  /**
   * When true, merges admin-auth headers (from `setAdminAuthProvider`) into
   * the request. Used by `adminSDK` to call `/admin/*` endpoints.
   * Mutually exclusive with `accessToken` (admin endpoints don't need user JWTs).
   */
  useAdminAuth?: boolean;
}

export const apiFetch = async <TBody, TResponse>(
  opts: FetchOptions<TBody>,
): Promise<TResponse> => {
  const url = `${opts.baseUrl}${opts.path}`;

  const headers: Record<string, string> = {};

  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let useCredentials = false;

  if (opts.useAdminAuth) {
    // Admin path — use admin headers ONLY (no Bearer, no cookies).
    const adminHeaders = getAdminAuthHeaders();
    if (adminHeaders) {
      Object.assign(headers, adminHeaders);
    }
  } else {
    const token = getEffectiveAccessToken(opts.accessToken);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      useCredentials = true;
    }
  }

  const response = await fetch(url, {
    method: opts.method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: useCredentials ? "include" : undefined,
  });

  if (!response.ok) {
    let errorBody: ApiErrorBody;
    try {
      errorBody = (await response.json()) as ApiErrorBody;
    } catch {
      errorBody = {
        status: "error",
        message: response.statusText || "Request failed",
      };
    }
    throw new ApiError(response.status, errorBody);
  }

  return (await response.json()) as TResponse;
};
