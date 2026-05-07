// Starter SDK schemas barrel.
// Re-exports only the GDPR + auth + account scaffolding kept in the starter.
// Add domain re-exports here as you scaffold features (use-sdk skill drives this).

export {
  POST_LOGIN_ROUTE_SCHEMA,
  POST_SIGNUP_ROUTE_SCHEMA,
  POST_REFRESH_ROUTE_SCHEMA,
  POST_LOGOUT_ROUTE_SCHEMA,
  POST_VERIFY_EMAIL_ROUTE_SCHEMA,
  POST_RESEND_VERIFICATION_CODE_ROUTE_SCHEMA,
  POST_FORGOT_PASSWORD_ROUTE_SCHEMA,
  POST_RESET_PASSWORD_ROUTE_SCHEMA,
} from "./auth.schema.js";

export {
  GET_NOTIFICATIONS_ROUTE_SCHEMA,
  GET_NOTIFICATION_COUNT_ROUTE_SCHEMA,
  PUT_NOTIFICATION_READ_ROUTE_SCHEMA,
  PUT_NOTIFICATIONS_READ_ALL_ROUTE_SCHEMA,
} from "./notification.schema.js";

export {
  GET_PROFILE_ROUTE_SCHEMA,
  PUT_PROFILE_ROUTE_SCHEMA,
  POST_COMPLETE_ONBOARDING_ROUTE_SCHEMA,
  POST_UPLOAD_AVATAR_ROUTE_SCHEMA,
} from "./profile.schema.js";

export { ERROR_CODES } from "./error-codes.js";
export type { ErrorCode } from "./error-codes.js";
export { ERROR_MESSAGES } from "./error-messages.js";

export type { WsClientMessage, WsServerMessage } from "./realtime.js";

export {
  PAGINATION_QUERY_SCHEMA,
  paginationResponseSchema,
  ID_PARAMS_SCHEMA,
} from "./pagination.js";

export {
  CONSENT_PURPOSES,
  MANDATORY_CONSENT_PURPOSES,
  GET_CONSENT_STATUS_ROUTE_SCHEMA,
  POST_CONSENT_GRANT_ROUTE_SCHEMA,
  POST_CONSENT_WITHDRAW_ROUTE_SCHEMA,
} from "./consent.schema.js";
export type { ConsentPurpose } from "./consent.schema.js";

export {
  GET_PRIVACY_POLICY_ROUTE_SCHEMA,
  GET_TERMS_ROUTE_SCHEMA,
} from "./legal.schema.js";

export {
  DELETE_ACCOUNT_ROUTE_SCHEMA,
  GET_ACCOUNT_EXPORT_ROUTE_SCHEMA,
} from "./account.schema.js";
