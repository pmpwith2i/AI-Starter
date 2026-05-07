// packages/server-sdk/src/client/example.ts
//
// Pattern: every domain has a typed client object hung off the SDK root.
// Method names align with the route verbs. Types come from the same schema files.

import type {
  CreateExampleBody,
  ExampleResponse,
} from "../schemas/example.schema.js";
import { apiFetch } from "./fetcher.js";

export const createExampleClient = (baseUrl: string) => ({
  create: (body: CreateExampleBody) =>
    apiFetch<ExampleResponse>(`${baseUrl}/example`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  get: (id: string) =>
    apiFetch<ExampleResponse>(`${baseUrl}/example/${id}`, { method: "GET" }),
});
