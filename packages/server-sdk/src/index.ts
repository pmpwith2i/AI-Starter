// Starter SDK barrel.
// Add domain client + type re-exports here as you scaffold features.
// All schemas re-exported from "@repo/server-sdk/schemas" via ./schemas/index.js.

export { createApiSDK } from "./sdk.js";
export type { ApiSDK } from "./sdk.js";

export { ApiError } from "./client/error.js";
export type { ApiErrorBody } from "./client/error.js";

export {
  setAccessTokenProvider,
  getEffectiveAccessToken,
  setAdminAuthProvider,
} from "./client/fetcher.js";

export type {
  AuthSDK,
  LoginBody,
  LoginResponse,
  SignupBody,
  SignupResponse,
  RefreshBody,
  RefreshResponse,
  LogoutBody,
  LogoutResponse,
  VerifyEmailBody,
  VerifyEmailResponse,
  ResendVerificationCodeResponse,
  ForgotPasswordBody,
  ForgotPasswordResponse,
  ResetPasswordBody,
  ResetPasswordResponse,
} from "./client/auth.js";

export type {
  NotificationSDK,
  NotificationsQuery,
  NotificationsResponse,
  NotificationCountResponse,
  MarkReadParams,
  MarkReadResponse,
  MarkAllReadResponse,
} from "./client/notification.js";

export type {
  ProfileSDK,
  ProfileResponse,
  UpdateProfileBody,
  CompleteOnboardingResponse,
  UploadAvatarResponse,
} from "./client/profile.js";

export type {
  ConsentSDK,
  ConsentStatusResponse,
  ConsentGrantBody,
  ConsentGrantResponse,
  ConsentWithdrawBody,
  ConsentWithdrawResponse,
} from "./client/consent.js";

export type { LegalSDK, LegalDocumentResponse } from "./client/legal.js";
