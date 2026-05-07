import {
  AUTH_SESSION_EXPIRED_EVENT,
  AUTH_STRATEGY,
  clearStoredTokens,
  getStoredRefreshToken,
  isLoggedIn,
  sdk,
  storeTokens,
} from "@/lib/api/client";
import type { AuthContextValue } from "@/lib/auth-context";
import { AuthContext } from "@/lib/auth-context";
import type { LoginBody, SignupBody } from "@repo/server-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const isBearerMode = AUTH_STRATEGY === "bearer";

interface UserInfo {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  emailVerified: boolean;
  onboardingCompleted: boolean;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  // If there is no login indicator at mount time, skip the async validation
  // entirely and start in a non-loading state.
  const [isLoading, setIsLoading] = useState(() => isLoggedIn());

  // When a background refresh fails (fired by `refreshAccessToken` in
  // `client.ts`), drop the user session in-place. Route-level `<Navigate>`
  // then bounces to `/login` via React Router — no full page reload, so
  // we don't loop through `/ → /app → /login` when a query fires a 401.
  useEffect(() => {
    const handler = () => {
      queryClient.clear();
      setUserInfo(null);
    };
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handler);
    return () =>
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handler);
  }, [queryClient]);

  const didRunRef = useRef(false);
  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;

    if (!isLoggedIn()) {
      return;
    }

    // Validate session by calling profile endpoint
    sdk.profile
      .get()
      .then((profile) => {
        setUserInfo({
          userId: profile.id,
          firstName: profile.firstName ?? null,
          lastName: profile.lastName ?? null,
          email: profile.email ?? null,
          emailVerified: profile.emailVerified,
          onboardingCompleted: profile.onboardingCompleted,
        });
      })
      .catch(async () => {
        // Token expired — try refresh
        try {
          const refreshToken = isBearerMode
            ? (getStoredRefreshToken() ?? "")
            : "";
          const refreshRes = await sdk.auth.refresh({ refreshToken });
          if (isBearerMode) {
            storeTokens(refreshRes.accessToken, refreshRes.refreshToken);
          }
          // Refresh succeeded — retry profile
          const profile = await sdk.profile.get();
          setUserInfo({
            userId: profile.id,
            firstName: profile.firstName ?? null,
            lastName: profile.lastName ?? null,
            email: profile.email ?? null,
            emailVerified: profile.emailVerified,
            onboardingCompleted: profile.onboardingCompleted,
          });
        } catch {
          // Both failed — user is logged out
          if (isBearerMode) {
            clearStoredTokens();
          }
          setUserInfo(null);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (body: LoginBody) => {
    const res = await sdk.auth.login(body);
    if (isBearerMode) {
      storeTokens(res.accessToken, res.refreshToken);
    }

    const onboardingCompleted = res.onboardingCompleted;
    const emailVerified = res.emailVerified;
    setUserInfo({
      userId: res.userId,
      firstName: res.firstName ?? null,
      lastName: res.lastName ?? null,
      email: res.email ?? null,
      emailVerified,
      onboardingCompleted,
    });
    return { onboardingCompleted, emailVerified };
  }, []);

  const signup = useCallback(async (body: SignupBody) => {
    const res = await sdk.auth.signup(body);
    if (isBearerMode) {
      storeTokens(res.accessToken, res.refreshToken);
    }
    const onboardingCompleted = res.onboardingCompleted;
    const emailVerified = res.emailVerified;
    setUserInfo({
      userId: res.userId,
      firstName: res.firstName ?? null,
      lastName: res.lastName ?? null,
      email: res.email ?? null,
      emailVerified,
      onboardingCompleted,
    });
    return { onboardingCompleted, emailVerified };
  }, []);

  const setOnboardingCompleted = useCallback((v: boolean) => {
    setUserInfo((prev) => {
      if (!prev) return prev;
      return { ...prev, onboardingCompleted: v };
    });
  }, []);

  const setEmailVerified = useCallback((v: boolean) => {
    setUserInfo((prev) => {
      if (!prev) return prev;
      return { ...prev, emailVerified: v };
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = isBearerMode ? (getStoredRefreshToken() ?? "") : "";
      await sdk.auth.logout({ refreshToken });
    } catch {
      // Ignore logout errors
    }
    if (isBearerMode) {
      clearStoredTokens();
    }
    // GDPR: wipe any cached PII (profile, clinical data, chat, appointments…)
    // from React Query and sessionStorage so the next user on this device
    // cannot see it.
    queryClient.clear();
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.clear();
      } catch {
        // sessionStorage can be unavailable (privacy modes) — ignore.
      }
    }
    setUserInfo(null);
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: userInfo !== null,
      isLoading,
      userId: userInfo?.userId ?? null,
      accessToken: null,
      firstName: userInfo?.firstName ?? null,
      lastName: userInfo?.lastName ?? null,
      email: userInfo?.email ?? null,
      emailVerified: userInfo?.emailVerified ?? null,
      onboardingCompleted: userInfo?.onboardingCompleted ?? null,
      setOnboardingCompleted,
      setEmailVerified,
      login,
      signup,
      logout,
    }),
    [
      userInfo,
      isLoading,
      login,
      signup,
      logout,
      setOnboardingCompleted,
      setEmailVerified,
    ],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
