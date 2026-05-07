const authResponseProperties = {
  userId: { type: "string" },
  firstName: { type: ["string", "null"] },
  lastName: { type: ["string", "null"] },
  email: { type: "string" },
  emailVerified: { type: "boolean" },
  onboardingCompleted: { type: "boolean" },
  accessToken: { type: "string" },
  refreshToken: { type: "string" },
} as const;

const authResponseRequired = [
  "userId",
  "firstName",
  "lastName",
  "email",
  "emailVerified",
  "onboardingCompleted",
  "accessToken",
  "refreshToken",
] as const;

export const POST_LOGIN_ROUTE_SCHEMA = {
  description:
    "Authenticate a user with email and password, returns access and refresh tokens",
  tags: ["auth"],
  body: {
    type: "object",
    required: ["email", "password"],
    additionalProperties: false,
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 1 },
    },
  },
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      properties: authResponseProperties,
      required: authResponseRequired,
    },
  },
} as const;

export const POST_SIGNUP_ROUTE_SCHEMA = {
  description:
    "Register a new patient account, returns access and refresh tokens",
  tags: ["auth"],
  body: {
    type: "object",
    required: ["email", "password", "firstName", "lastName", "termsAccepted"],
    additionalProperties: false,
    properties: {
      email: { type: "string", format: "email" },
      password: {
        type: "string",
        minLength: 6,
        maxLength: 64,
        pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
        description:
          "6-64 characters, must include at least one uppercase letter, one lowercase letter, and one digit",
      },
      firstName: { type: "string", minLength: 1, maxLength: 50 },
      lastName: { type: "string", minLength: 1, maxLength: 50 },
      /**
       * GDPR — explicit terms + privacy acceptance at signup. Must be `true`
       * or the request is rejected. The server records preliminary
       * `terms_of_service` + `privacy_policy` consents on success.
       */
      termsAccepted: { type: "boolean", const: true },
    },
  },
  response: {
    201: {
      type: "object",
      additionalProperties: false,
      properties: authResponseProperties,
      required: authResponseRequired,
    },
  },
} as const;

export const POST_REFRESH_ROUTE_SCHEMA = {
  description: "Exchange a refresh token for a new access/refresh token pair",
  tags: ["auth"],
  body: {
    type: "object",
    required: [],
    additionalProperties: false,
    properties: {
      refreshToken: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      properties: {
        accessToken: { type: "string" },
        refreshToken: { type: "string" },
      },
      required: ["accessToken", "refreshToken"],
    },
  },
} as const;

export const POST_LOGOUT_ROUTE_SCHEMA = {
  description: "Invalidate a refresh token",
  tags: ["auth"],
  body: {
    type: "object",
    required: ["refreshToken"],
    additionalProperties: false,
    properties: {
      refreshToken: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
  },
} as const;

export const POST_VERIFY_EMAIL_ROUTE_SCHEMA = {
  description: "Verify email address using a 6-digit code",
  tags: ["auth"],
  body: {
    type: "object",
    required: ["code"],
    additionalProperties: false,
    properties: {
      code: { type: "string", minLength: 6, maxLength: 6 },
    },
  },
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      properties: {
        verified: { type: "boolean" },
      },
      required: ["verified"],
    },
  },
} as const;

export const POST_RESEND_VERIFICATION_CODE_ROUTE_SCHEMA = {
  description: "Resend email verification code",
  tags: ["auth"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      properties: {
        sent: { type: "boolean" },
        message: { type: "string" },
      },
      required: ["sent", "message"],
    },
  },
} as const;

export const POST_FORGOT_PASSWORD_ROUTE_SCHEMA = {
  description:
    "Request a password reset code. Always returns 200 to prevent email enumeration.",
  tags: ["auth"],
  body: {
    type: "object",
    required: ["email"],
    additionalProperties: false,
    properties: {
      email: { type: "string", format: "email" },
    },
  },
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
  },
} as const;

export const POST_RESET_PASSWORD_ROUTE_SCHEMA = {
  description: "Reset password using a 6-digit code",
  tags: ["auth"],
  body: {
    type: "object",
    required: ["email", "code", "newPassword"],
    additionalProperties: false,
    properties: {
      email: { type: "string", format: "email" },
      code: { type: "string", minLength: 6, maxLength: 6 },
      newPassword: {
        type: "string",
        minLength: 6,
        maxLength: 64,
        pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
        description:
          "6-64 characters, must include at least one uppercase letter, one lowercase letter, and one digit",
      },
    },
  },
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
  },
} as const;
