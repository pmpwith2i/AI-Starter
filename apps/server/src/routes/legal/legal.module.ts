import type { FastifyInstance } from "fastify";
import type { FromSchema } from "json-schema-to-ts";
import {
  GET_PRIVACY_POLICY_ROUTE_SCHEMA,
  GET_TERMS_ROUTE_SCHEMA,
} from "@repo/server-sdk/schemas";
import { ENVIRONMENT_VARIABLES } from "#src/constants/env.constants.js";

// Placeholder policy text. Replace with your real legal copy (or invoke
// the `gdpr-compliance:gdpr-compliance` skill to draft a tailored Privacy
// Policy + Terms). Bump PRIVACY_POLICY_VERSION / TERMS_VERSION env vars to
// force every user to re-accept the new version on next login.
const PRIVACY_POLICY_PLACEHOLDER = `# Privacy Policy

_Version: ${"${version}"}_

This is a placeholder privacy policy for {{PROJECT_NAME}}.

## Data we collect
- Account data (email, name)
- Usage data
- (Add health-data and other special-category items as your domain dictates.)

## Purposes
- Account management
- Service delivery

## Lawful bases (GDPR Art. 6 / Art. 9)
- Contract performance (Art. 6(1)(b))
- Explicit consent for any health data processing (Art. 9(2)(a))

## Your rights
You can exercise access / rectification / erasure / portability rights from
your account settings or by contacting our DPO.

---

_Replace this placeholder before going to production._`;

const TERMS_PLACEHOLDER = `# Terms of Service

_Version: ${"${version}"}_

This is a placeholder terms-of-service document for {{PROJECT_NAME}}.

## Subject
{{PROJECT_NAME}} is a software platform offered by {{COMPANY_NAME}}.

## Registration
Access requires creating an account and verifying your email address.

## Use of the platform
The user agrees to provide accurate information and to use the platform in
compliance with applicable law.

## Disclaimers
Add domain-specific disclaimers here (medical, financial, etc.) before
exposing the service publicly.

---

_Replace this placeholder before going to production._`;

export default async (fastify: FastifyInstance) => {
  fastify.get<{
    Reply: {
      200: FromSchema<(typeof GET_PRIVACY_POLICY_ROUTE_SCHEMA.response)[200]>;
    };
  }>("/privacy-policy", {
    schema: GET_PRIVACY_POLICY_ROUTE_SCHEMA,
    handler: async () => {
      const version = ENVIRONMENT_VARIABLES.PRIVACY_POLICY_VERSION;
      return {
        version,
        content: PRIVACY_POLICY_PLACEHOLDER.replace("${version}", version),
        updatedAt: new Date(version).toISOString(),
      };
    },
  });

  fastify.get<{
    Reply: {
      200: FromSchema<(typeof GET_TERMS_ROUTE_SCHEMA.response)[200]>;
    };
  }>("/terms", {
    schema: GET_TERMS_ROUTE_SCHEMA,
    handler: async () => {
      const version = ENVIRONMENT_VARIABLES.TERMS_VERSION;
      return {
        version,
        content: TERMS_PLACEHOLDER.replace("${version}", version),
        updatedAt: new Date(version).toISOString(),
      };
    },
  });
};
