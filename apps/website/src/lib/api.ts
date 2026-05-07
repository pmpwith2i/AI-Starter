import { createApiSDK } from "@repo/server-sdk";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

/** Server-side SDK instance — used in RSC and route handlers. No cookies needed for public endpoints. */
export const api = createApiSDK(API_BASE_URL);

/** Dashboard app URL for redirect after login */
export const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:5173";

/** Public API base URL for client-side calls */
export const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
