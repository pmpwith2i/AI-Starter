import { createContext } from "react";
import type { LoginBody, SignupBody } from "@repo/server-sdk";

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  accessToken: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  emailVerified: boolean | null;
  onboardingCompleted: boolean | null;
  setOnboardingCompleted: (v: boolean) => void;
  setEmailVerified: (v: boolean) => void;
  login: (body: LoginBody) => Promise<{
    onboardingCompleted: boolean;
    emailVerified: boolean;
  }>;
  signup: (body: SignupBody) => Promise<{
    onboardingCompleted: boolean;
    emailVerified: boolean;
  }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
