import {
  ApiError,
  type ForgotPasswordBody,
  type LoginBody,
  type ResetPasswordBody,
  type SignupBody,
  type VerifyEmailBody,
} from "@repo/server-sdk";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { sdk } from "../api/client";
import { queryClient } from "../api/query-client";
import {
  clearStoredTokens,
  getStoredRefreshToken,
  loadStoredTokens,
  storeTokens,
} from "./secure-store";
import { setRefreshHandler, setSessionExpiredHandler } from "./session-events";

export type AuthUser = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
};

export type AuthStatus = "bootstrap" | "anonymous" | "authenticated";

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
};

type AuthContextValue = AuthState & {
  login: (body: LoginBody) => Promise<void>;
  signup: (body: SignupBody) => Promise<void>;
  verifyEmail: (body: VerifyEmailBody) => Promise<boolean>;
  resendVerificationCode: () => Promise<void>;
  forgotPassword: (body: ForgotPasswordBody) => Promise<void>;
  resetPassword: (body: ResetPasswordBody) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Flip the local user's onboardingCompleted flag — after a successful
   *  finish of the onboarding wizard. Server is updated separately via
   *  `sdk.profile.completeOnboarding()`. */
  markOnboardingComplete: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const userFromAuthResponse = (
  res: Awaited<ReturnType<typeof sdk.auth.login>>,
): AuthUser => ({
  userId: res.userId,
  firstName: res.firstName,
  lastName: res.lastName,
  email: res.email,
  emailVerified: res.emailVerified,
  onboardingCompleted: res.onboardingCompleted,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "bootstrap",
    user: null,
  });

  // Bootstrap: validate the stored token by fetching /profile. If the access
  // token is expired, transparently try the refresh flow; if everything fails
  // we clear tokens and fall back to anonymous so the layout redirects to
  // /welcome instead of leaving the user in a half-authenticated state.
  useEffect(() => {
    let cancelled = false;

    const refreshSession = async (): Promise<boolean> => {
      const refreshToken = (await getStoredRefreshToken()) ?? "";
      if (!refreshToken) return false;
      try {
        const res = await sdk.auth.refresh({ refreshToken });
        await storeTokens(res.accessToken, res.refreshToken);
        return true;
      } catch {
        return false;
      }
    };

    const setAuthenticatedFromProfile = (
      profile: Awaited<ReturnType<typeof sdk.profile.get>>,
    ): void => {
      setState({
        status: "authenticated",
        user: {
          userId: profile.id,
          firstName: profile.firstName ?? null,
          lastName: profile.lastName ?? null,
          email: profile.email,
          emailVerified: profile.emailVerified,
          onboardingCompleted: profile.onboardingCompleted,
        },
      });
    };

    const setAnonymousAndClear = async (): Promise<void> => {
      await clearStoredTokens();
      queryClient.clear();
      setState({ status: "anonymous", user: null });
    };

    void (async () => {
      const { accessToken } = await loadStoredTokens();
      if (cancelled) return;
      if (!accessToken) {
        setState({ status: "anonymous", user: null });
        return;
      }
      try {
        const profile = await sdk.profile.get();
        if (cancelled) return;
        setAuthenticatedFromProfile(profile);
      } catch (err) {
        if (cancelled) return;
        // 401 → access token expired. Try refresh once, then re-fetch.
        if (err instanceof ApiError && err.statusCode === 401) {
          const refreshed = await refreshSession();
          if (cancelled) return;
          if (refreshed) {
            try {
              const profile = await sdk.profile.get();
              if (cancelled) return;
              setAuthenticatedFromProfile(profile);
              return;
            } catch {
              // refresh worked but profile still fails — give up
            }
          }
        }
        // Either non-401 (no backend, network error) or refresh failed.
        // Either way, the safest UX is to surface the login screen.
        await setAnonymousAndClear();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Wire the session-event handlers used by the QueryClient: refresh attempt
  // on 401, hard logout on irrecoverable session loss.
  useEffect(() => {
    setRefreshHandler(async () => {
      const refreshToken = (await getStoredRefreshToken()) ?? "";
      if (!refreshToken) return false;
      try {
        const res = await sdk.auth.refresh({ refreshToken });
        await storeTokens(res.accessToken, res.refreshToken);
        return true;
      } catch {
        return false;
      }
    });
    setSessionExpiredHandler(async () => {
      await clearStoredTokens();
      queryClient.clear();
      setState({ status: "anonymous", user: null });
    });
    return () => {
      setRefreshHandler(null);
      setSessionExpiredHandler(null);
    };
  }, []);

  const login = useCallback(async (body: LoginBody) => {
    const res = await sdk.auth.login(body);
    await storeTokens(res.accessToken, res.refreshToken);
    setState({ status: "authenticated", user: userFromAuthResponse(res) });
  }, []);

  const signup = useCallback(async (body: SignupBody) => {
    const res = await sdk.auth.signup(body);
    await storeTokens(res.accessToken, res.refreshToken);
    setState({ status: "authenticated", user: userFromAuthResponse(res) });
  }, []);

  const verifyEmail = useCallback(async (body: VerifyEmailBody) => {
    const res = await sdk.auth.verifyEmail(body);
    setState((prev) =>
      prev.user
        ? { ...prev, user: { ...prev.user, emailVerified: res.verified } }
        : prev,
    );
    return res.verified;
  }, []);

  const resendVerificationCode = useCallback(async () => {
    await sdk.auth.resendVerificationCode();
  }, []);

  const forgotPassword = useCallback(async (body: ForgotPasswordBody) => {
    await sdk.auth.forgotPassword(body);
  }, []);

  const resetPassword = useCallback(async (body: ResetPasswordBody) => {
    await sdk.auth.resetPassword(body);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = (await getStoredRefreshToken()) ?? "";
    try {
      await sdk.auth.logout({ refreshToken });
    } catch {
      // best-effort: clear local state even if server rejects
    }
    await clearStoredTokens();
    // Drop every cached query so the next user (or re-login) starts clean.
    queryClient.clear();
    setState({ status: "anonymous", user: null });
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await sdk.profile.get();
    setState({
      status: "authenticated",
      user: {
        userId: profile.id,
        firstName: profile.firstName ?? null,
        lastName: profile.lastName ?? null,
        email: profile.email,
        emailVerified: profile.emailVerified,
        onboardingCompleted: profile.onboardingCompleted,
      },
    });
  }, []);

  const markOnboardingComplete = useCallback(() => {
    setState((prev) =>
      prev.user
        ? { ...prev, user: { ...prev.user, onboardingCompleted: true } }
        : prev,
    );
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      signup,
      verifyEmail,
      resendVerificationCode,
      forgotPassword,
      resetPassword,
      logout,
      refreshProfile,
      markOnboardingComplete,
    }),
    [
      state,
      login,
      signup,
      verifyEmail,
      resendVerificationCode,
      forgotPassword,
      resetPassword,
      logout,
      refreshProfile,
      markOnboardingComplete,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
