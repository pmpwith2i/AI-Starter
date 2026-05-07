import type { FromSchema } from "json-schema-to-ts";
import {
  POST_LOGIN_ROUTE_SCHEMA,
  POST_SIGNUP_ROUTE_SCHEMA,
  POST_REFRESH_ROUTE_SCHEMA,
  POST_LOGOUT_ROUTE_SCHEMA,
  POST_VERIFY_EMAIL_ROUTE_SCHEMA,
  POST_RESEND_VERIFICATION_CODE_ROUTE_SCHEMA,
  POST_FORGOT_PASSWORD_ROUTE_SCHEMA,
  POST_RESET_PASSWORD_ROUTE_SCHEMA,
} from "../schemas/auth.schema.js";
import { apiFetch } from "./fetcher.js";

export type LoginBody = FromSchema<typeof POST_LOGIN_ROUTE_SCHEMA.body>;
export type LoginResponse = FromSchema<
  (typeof POST_LOGIN_ROUTE_SCHEMA.response)[200]
>;
export type SignupBody = FromSchema<typeof POST_SIGNUP_ROUTE_SCHEMA.body>;
export type SignupResponse = FromSchema<
  (typeof POST_SIGNUP_ROUTE_SCHEMA.response)[201]
>;
export type RefreshBody = FromSchema<typeof POST_REFRESH_ROUTE_SCHEMA.body>;
export type RefreshResponse = FromSchema<
  (typeof POST_REFRESH_ROUTE_SCHEMA.response)[200]
>;
export type LogoutBody = FromSchema<typeof POST_LOGOUT_ROUTE_SCHEMA.body>;
export type LogoutResponse = FromSchema<
  (typeof POST_LOGOUT_ROUTE_SCHEMA.response)[200]
>;
export type VerifyEmailBody = FromSchema<
  typeof POST_VERIFY_EMAIL_ROUTE_SCHEMA.body
>;
export type VerifyEmailResponse = FromSchema<
  (typeof POST_VERIFY_EMAIL_ROUTE_SCHEMA.response)[200]
>;
export type ResendVerificationCodeResponse = FromSchema<
  (typeof POST_RESEND_VERIFICATION_CODE_ROUTE_SCHEMA.response)[200]
>;
export type ForgotPasswordBody = FromSchema<
  typeof POST_FORGOT_PASSWORD_ROUTE_SCHEMA.body
>;
export type ForgotPasswordResponse = FromSchema<
  (typeof POST_FORGOT_PASSWORD_ROUTE_SCHEMA.response)[200]
>;
export type ResetPasswordBody = FromSchema<
  typeof POST_RESET_PASSWORD_ROUTE_SCHEMA.body
>;
export type ResetPasswordResponse = FromSchema<
  (typeof POST_RESET_PASSWORD_ROUTE_SCHEMA.response)[200]
>;

export interface AuthSDK {
  login: (body: LoginBody) => Promise<LoginResponse>;
  signup: (body: SignupBody) => Promise<SignupResponse>;
  refresh: (body: RefreshBody) => Promise<RefreshResponse>;
  logout: (body: LogoutBody) => Promise<LogoutResponse>;
  verifyEmail: (body: VerifyEmailBody) => Promise<VerifyEmailResponse>;
  resendVerificationCode: () => Promise<ResendVerificationCodeResponse>;
  forgotPassword: (body: ForgotPasswordBody) => Promise<ForgotPasswordResponse>;
  resetPassword: (body: ResetPasswordBody) => Promise<ResetPasswordResponse>;
}

export const createAuthSDK = (baseUrl: string): AuthSDK => ({
  login: (body) =>
    apiFetch<LoginBody, LoginResponse>({
      baseUrl,
      path: "/auth/login",
      method: "POST",
      body,
    }),

  signup: (body) =>
    apiFetch<SignupBody, SignupResponse>({
      baseUrl,
      path: "/auth/signup",
      method: "POST",
      body,
    }),

  refresh: (body) =>
    apiFetch<RefreshBody, RefreshResponse>({
      baseUrl,
      path: "/auth/refresh",
      method: "POST",
      body,
    }),

  logout: (body) =>
    apiFetch<LogoutBody, LogoutResponse>({
      baseUrl,
      path: "/auth/logout",
      method: "POST",
      body,
    }),

  verifyEmail: (body) =>
    apiFetch<VerifyEmailBody, VerifyEmailResponse>({
      baseUrl,
      path: "/auth/verify-email",
      method: "POST",
      body,
    }),

  resendVerificationCode: () =>
    apiFetch<undefined, ResendVerificationCodeResponse>({
      baseUrl,
      path: "/auth/resend-verification-code",
      method: "POST",
    }),

  forgotPassword: (body) =>
    apiFetch<ForgotPasswordBody, ForgotPasswordResponse>({
      baseUrl,
      path: "/auth/forgot-password",
      method: "POST",
      body,
    }),

  resetPassword: (body) =>
    apiFetch<ResetPasswordBody, ResetPasswordResponse>({
      baseUrl,
      path: "/auth/reset-password",
      method: "POST",
      body,
    }),
});
