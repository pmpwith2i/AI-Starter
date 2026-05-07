import type { FromSchema } from "json-schema-to-ts";
import {
  GET_CONSENT_STATUS_ROUTE_SCHEMA,
  POST_CONSENT_GRANT_ROUTE_SCHEMA,
  POST_CONSENT_WITHDRAW_ROUTE_SCHEMA,
} from "../schemas/consent.schema.js";
import { apiFetch } from "./fetcher.js";

export type ConsentStatusResponse = FromSchema<
  (typeof GET_CONSENT_STATUS_ROUTE_SCHEMA.response)[200]
>;

export type ConsentGrantBody = FromSchema<
  typeof POST_CONSENT_GRANT_ROUTE_SCHEMA.body
>;

export type ConsentGrantResponse = FromSchema<
  (typeof POST_CONSENT_GRANT_ROUTE_SCHEMA.response)[200]
>;

export type ConsentWithdrawBody = FromSchema<
  typeof POST_CONSENT_WITHDRAW_ROUTE_SCHEMA.body
>;

export type ConsentWithdrawResponse = FromSchema<
  (typeof POST_CONSENT_WITHDRAW_ROUTE_SCHEMA.response)[200]
>;

export interface ConsentSDK {
  getStatus: (accessToken?: string) => Promise<ConsentStatusResponse>;
  grant: (
    body: ConsentGrantBody,
    accessToken?: string,
  ) => Promise<ConsentGrantResponse>;
  withdraw: (
    body: ConsentWithdrawBody,
    accessToken?: string,
  ) => Promise<ConsentWithdrawResponse>;
}

export const createConsentSDK = (baseUrl: string): ConsentSDK => ({
  getStatus: (accessToken) =>
    apiFetch<undefined, ConsentStatusResponse>({
      baseUrl,
      path: "/consent/status",
      method: "GET",
      accessToken,
    }),
  grant: (body, accessToken) =>
    apiFetch<ConsentGrantBody, ConsentGrantResponse>({
      baseUrl,
      path: "/consent/grant",
      method: "POST",
      body,
      accessToken,
    }),
  withdraw: (body, accessToken) =>
    apiFetch<ConsentWithdrawBody, ConsentWithdrawResponse>({
      baseUrl,
      path: "/consent/withdraw",
      method: "POST",
      body,
      accessToken,
    }),
});
