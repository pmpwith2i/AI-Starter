import type { FromSchema } from "json-schema-to-ts";
import {
  GET_PRIVACY_POLICY_ROUTE_SCHEMA,
  GET_TERMS_ROUTE_SCHEMA,
} from "../schemas/legal.schema.js";
import { apiFetch } from "./fetcher.js";

export type LegalDocumentResponse = FromSchema<
  (typeof GET_PRIVACY_POLICY_ROUTE_SCHEMA.response)[200]
>;

export interface LegalSDK {
  getPrivacyPolicy: () => Promise<LegalDocumentResponse>;
  getTerms: () => Promise<
    FromSchema<(typeof GET_TERMS_ROUTE_SCHEMA.response)[200]>
  >;
}

export const createLegalSDK = (baseUrl: string): LegalSDK => ({
  getPrivacyPolicy: () =>
    apiFetch<undefined, LegalDocumentResponse>({
      baseUrl,
      path: "/legal/privacy-policy",
      method: "GET",
    }),
  getTerms: () =>
    apiFetch<
      undefined,
      FromSchema<(typeof GET_TERMS_ROUTE_SCHEMA.response)[200]>
    >({
      baseUrl,
      path: "/legal/terms",
      method: "GET",
    }),
});
