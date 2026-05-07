import envSchema from "env-schema";

const schema = {
  type: "object",
  required: [
    "DATABASE_URL",
    "JWT_SECRET_KEY",
    "RESEND_API_KEY",
    "ENCRYPTION_KEY",
  ],
  properties: {
    SERVER_PORT: { type: "number", default: 3000 },
    HOST: { type: "string", default: "0.0.0.0" },
    DATABASE_URL: { type: "string" },
    LOG_LEVEL: { type: "string", default: "info" },
    JWT_SECRET_KEY: { type: "string" },
    JWT_EXPIRY: { type: "string", default: "30m" },
    REFRESH_TOKEN_EXPIRY_SECONDS: { type: "number", default: 604800 },
    NODE_ENV: { type: "string", default: "development" },
    FRONTEND_URL: { type: "string", default: "http://localhost:5173" },
    PG_LISTEN_URL: { type: "string", default: "" },
    COOKIE_DOMAIN: { type: "string", default: "" },
    ALLOWED_ORIGINS: { type: "string", default: "" },
    RESEND_API_KEY: { type: "string" },
    EMAIL_FROM: { type: "string", default: "noreply@example.com" },
    ENCRYPTION_KEY: { type: "string" },
    PRIVACY_POLICY_VERSION: { type: "string", default: "1.0" },
    TERMS_VERSION: { type: "string", default: "1.0" },
  },
} as const;

interface EnvConfig {
  SERVER_PORT: number;
  HOST: string;
  DATABASE_URL: string;
  LOG_LEVEL: string;
  JWT_SECRET_KEY: string;
  JWT_EXPIRY: string;
  REFRESH_TOKEN_EXPIRY_SECONDS: number;
  NODE_ENV: string;
  FRONTEND_URL: string;
  PG_LISTEN_URL: string;
  /** Cookie domain for auth cookies (e.g., ".example.com"). Empty = no Domain attribute (localhost). */
  COOKIE_DOMAIN: string;
  /** Comma-separated list of allowed origins for CORS. Falls back to FRONTEND_URL if empty. */
  ALLOWED_ORIGINS: string;
  /** Resend API key for sending transactional emails (verification, password reset). Required. */
  RESEND_API_KEY: string;
  /** Sender email address for transactional emails. */
  EMAIL_FROM: string;
  /** AES-256 key (hex-encoded 32 bytes). Required — loaded from AWS Secrets Manager in prod. */
  ENCRYPTION_KEY: string;
  /** Version tag of the current privacy policy — used for consent versioning. */
  PRIVACY_POLICY_VERSION: string;
  /** Version tag of the current terms of service — used for consent versioning. */
  TERMS_VERSION: string;
}

export const ENVIRONMENT_VARIABLES: EnvConfig = envSchema<EnvConfig>({
  schema,
  dotenv: true,
});

export const isDev = ENVIRONMENT_VARIABLES.NODE_ENV !== "production";

if (!ENVIRONMENT_VARIABLES.ENCRYPTION_KEY) {
  throw new Error(
    "ENCRYPTION_KEY environment variable is required for encrypting sensitive data",
  );
}
