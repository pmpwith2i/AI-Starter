const profileObject = {
  type: "object",
  required: [
    "id",
    "email",
    "emailVerified",
    "onboardingCompleted",
    "createdAt",
  ],
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    firstName: { type: ["string", "null"] },
    lastName: { type: ["string", "null"] },
    email: { type: "string" },
    emailVerified: { type: "boolean" },
    phone: { type: ["string", "null"] },
    dateOfBirth: { type: ["string", "null"] },
    avatar: { type: ["string", "null"] },
    preferences: {},
    onboardingCompleted: { type: "boolean" },
    createdAt: { type: "string" },
  },
} as const;

export const GET_PROFILE_ROUTE_SCHEMA = {
  response: {
    200: profileObject,
  },
} as const;

export const PUT_PROFILE_ROUTE_SCHEMA = {
  body: {
    type: "object",
    additionalProperties: false,
    properties: {
      firstName: { type: "string" },
      lastName: { type: "string" },
      name: { type: "string" },
      phone: { type: "string" },
      dateOfBirth: { type: "string" },
      avatar: { type: "string" },
      preferences: {},
    },
  },
  response: {
    200: profileObject,
  },
} as const;

export const POST_COMPLETE_ONBOARDING_ROUTE_SCHEMA = {
  response: {
    200: {
      type: "object",
      required: ["success"],
      additionalProperties: false,
      properties: {
        success: { type: "boolean" },
      },
    },
  },
} as const;

export const POST_UPLOAD_AVATAR_ROUTE_SCHEMA = {
  response: {
    200: {
      type: "object",
      required: ["avatarUrl"],
      additionalProperties: false,
      properties: {
        avatarUrl: { type: "string" },
      },
    },
  },
} as const;
