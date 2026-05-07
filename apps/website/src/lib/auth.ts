const INDICATOR_COOKIE = "app_logged_in";

/**
 * Check if the user has an active login session by reading the indicator cookie.
 * Must only be called client-side (in useEffect or event handlers) to avoid hydration mismatches.
 */
export function isLoggedIn(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => {
    const [key, val] = c.trim().split("=");
    return key === INDICATOR_COOKIE && val === "1";
  });
}
