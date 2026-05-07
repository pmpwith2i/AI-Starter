import type { FastifyReply } from "fastify";
import { ENVIRONMENT_VARIABLES } from "#src/constants/env.constants.js";

const COOKIE_NAMES = {
  ACCESS_TOKEN: "app_access_token",
  REFRESH_TOKEN: "app_refresh_token",
  LOGGED_IN: "app_logged_in",
} as const;

function getCookieOptions(maxAge: number) {
  const isProd = ENVIRONMENT_VARIABLES.NODE_ENV === "production";
  const domain = ENVIRONMENT_VARIABLES.COOKIE_DOMAIN || undefined;

  return {
    path: "/",
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    maxAge,
    ...(domain ? { domain } : {}),
  };
}

/** Parse JWT_EXPIRY (e.g., "30m", "1h") to seconds */
function parseExpiryToSeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 1800; // default 30m
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 3600;
    case "d":
      return value * 86400;
    default:
      return 1800;
  }
}

/**
 * Set auth cookies on the response:
 * - httpOnly access token cookie
 * - httpOnly refresh token cookie
 * - non-httpOnly indicator cookie (readable by JS for UI state)
 */
export function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string,
): void {
  const accessMaxAge = parseExpiryToSeconds(ENVIRONMENT_VARIABLES.JWT_EXPIRY);
  const refreshMaxAge = ENVIRONMENT_VARIABLES.REFRESH_TOKEN_EXPIRY_SECONDS;
  const isProd = ENVIRONMENT_VARIABLES.NODE_ENV === "production";
  const domain = ENVIRONMENT_VARIABLES.COOKIE_DOMAIN || undefined;

  // httpOnly access token
  void reply.header(
    "Set-Cookie",
    serializeCookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
      ...getCookieOptions(accessMaxAge),
    }),
  );

  // httpOnly refresh token
  void reply.header(
    "Set-Cookie",
    serializeCookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      ...getCookieOptions(refreshMaxAge),
      path: "/auth", // only sent to auth endpoints
    }),
  );

  // non-httpOnly indicator cookie (JS-readable for UI)
  void reply.header(
    "Set-Cookie",
    serializeCookie(COOKIE_NAMES.LOGGED_IN, "1", {
      path: "/",
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
      maxAge: refreshMaxAge,
      ...(domain ? { domain } : {}),
    }),
  );
}

/** Clear all auth cookies */
export function clearAuthCookies(reply: FastifyReply): void {
  const isProd = ENVIRONMENT_VARIABLES.NODE_ENV === "production";
  const domain = ENVIRONMENT_VARIABLES.COOKIE_DOMAIN || undefined;
  const base = {
    path: "/",
    secure: isProd,
    sameSite: "lax" as const,
    maxAge: 0,
    ...(domain ? { domain } : {}),
  };

  void reply.header(
    "Set-Cookie",
    serializeCookie(COOKIE_NAMES.ACCESS_TOKEN, "", { ...base, httpOnly: true }),
  );
  void reply.header(
    "Set-Cookie",
    serializeCookie(COOKIE_NAMES.REFRESH_TOKEN, "", {
      ...base,
      httpOnly: true,
      path: "/auth",
    }),
  );
  void reply.header(
    "Set-Cookie",
    serializeCookie(COOKIE_NAMES.LOGGED_IN, "", { ...base, httpOnly: false }),
  );
}

/** Parse cookies from request header */
export function parseCookies(
  cookieHeader: string | undefined,
): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  for (const pair of cookieHeader.split(";")) {
    const [key, ...rest] = pair.trim().split("=");
    if (key) cookies[key.trim()] = rest.join("=").trim();
  }
  return cookies;
}

/** Get access token from cookies */
export function getAccessTokenFromCookies(
  cookieHeader: string | undefined,
): string | undefined {
  const cookies = parseCookies(cookieHeader);
  return cookies[COOKIE_NAMES.ACCESS_TOKEN] || undefined;
}

/** Get refresh token from cookies */
export function getRefreshTokenFromCookies(
  cookieHeader: string | undefined,
): string | undefined {
  const cookies = parseCookies(cookieHeader);
  return cookies[COOKIE_NAMES.REFRESH_TOKEN] || undefined;
}

/** Serialize a cookie string */
function serializeCookie(
  name: string,
  value: string,
  options: {
    path?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
    maxAge?: number;
    domain?: string;
  },
): string {
  let cookie = `${name}=${encodeURIComponent(value)}`;
  if (options.path) cookie += `; Path=${options.path}`;
  if (options.domain) cookie += `; Domain=${options.domain}`;
  if (options.maxAge !== undefined) cookie += `; Max-Age=${options.maxAge}`;
  if (options.httpOnly) cookie += "; HttpOnly";
  if (options.secure) cookie += "; Secure";
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
  return cookie;
}

export { COOKIE_NAMES };
