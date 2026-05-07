---
name: use-sdk
description: Develop typed API SDK client modules in @repo/server-sdk. Use when adding new SDK domains, adding methods to existing modules, creating route schemas, wire-up the server using it or working with the schema-driven type pattern (JSON Schema -> FromSchema<> -> typed client). Covers client files, schema files, servers, sdk.ts wiring, and index.ts exports.
---

# @repo/server-sdk Development

## Quick start

The SDK lives at `packages/server-sdk/`. Two export paths:

- `@repo/server-sdk` — factory, types, `ApiError`
- `@repo/server-sdk/schemas` — JSON Schema route definitions

## Adding a new SDK module

### Checklist

- [ ] Create schema file: `src/schemas/{domain}.schema.ts`
- [ ] Create client file: `src/client/{domain}.ts`
- [ ] Wire into factory: `src/sdk.ts`
- [ ] Export types: `src/index.ts`
- [ ] Export schemas: `src/schemas/index.ts`
- [ ] (Optional) Add server route using the new schema
- [ ] (Optional) Add dashboard hooks

### 1. Schema file (`src/schemas/{domain}.schema.ts`)

```typescript
export const GET_THINGS_ROUTE_SCHEMA = {
  description: "List all things",
  tags: ["things"],
  response: {
    200: {
      type: "object",
      required: ["items", "pagination"],
      additionalProperties: false,
      properties: {
        items: {
          type: "array",
          items: {
            /* item schema */
          },
        },
        pagination: { $ref: "use paginationResponseSchema" },
      },
    },
  },
} as const;

// POST/PUT routes add a `body` key:
export const POST_THING_ROUTE_SCHEMA = {
  description: "Create a thing",
  tags: ["things"],
  body: {
    type: "object",
    required: ["name"],
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 1 },
    },
  },
  response: {
    201: {
      /* ... */
    },
  },
} as const;
```

Rules:

- Always use `as const` for type inference
- Always set `additionalProperties: false`
- Use `required` array for mandatory fields
- Use shared `paginationResponseSchema` for paginated responses
- Naming: `{METHOD}_{DOMAIN}_{ACTION}_ROUTE_SCHEMA`

### 2. Client file (`src/client/{domain}.ts`)

```typescript
import type { FromSchema } from "json-schema-to-ts";
import {
  GET_THINGS_ROUTE_SCHEMA,
  POST_THING_ROUTE_SCHEMA,
} from "../schemas/thing.schema.js";
import { apiFetch } from "./fetcher.js";

// Derive types from schemas
export type ThingsResponse = FromSchema<
  (typeof GET_THINGS_ROUTE_SCHEMA.response)[200]
>;
export type CreateThingBody = FromSchema<typeof POST_THING_ROUTE_SCHEMA.body>;
export type CreateThingResponse = FromSchema<
  (typeof POST_THING_ROUTE_SCHEMA.response)[201]
>;

// Define the SDK interface
export interface ThingSDK {
  list: (accessToken?: string) => Promise<ThingsResponse>;
  create: (
    body: CreateThingBody,
    accessToken?: string,
  ) => Promise<CreateThingResponse>;
  detail: (id: string, accessToken?: string) => Promise<ThingDetailResponse>;
}

// Implement the factory
export const createThingSDK = (baseUrl: string): ThingSDK => ({
  list: (accessToken) =>
    apiFetch<never, ThingsResponse>({
      baseUrl,
      path: "/things",
      method: "GET",
      accessToken,
    }),
  create: (body, accessToken) =>
    apiFetch<CreateThingBody, CreateThingResponse>({
      baseUrl,
      path: "/things",
      method: "POST",
      body,
      accessToken,
    }),
  detail: (id, accessToken) =>
    apiFetch<never, ThingDetailResponse>({
      baseUrl,
      path: `/things/${id}`,
      method: "GET",
      accessToken,
    }),
});
```

Patterns:

- GET with no body: use `never` as TBody generic
- Auth-optional: `accessToken?: string` as last param
- Response type: `FromSchema<(typeof SCHEMA.response)[statusCode]>`
- Body type: `FromSchema<typeof SCHEMA.body>`
- Query params: build into path string or accept typed query object

### 3. Wire into `src/sdk.ts`

```typescript
import { createThingSDK } from "./client/thing.js";
import type { ThingSDK } from "./client/thing.js";

// Add to ApiSDK interface
export interface ApiSDK {
  // ... existing modules
  things: ThingSDK;
}

// Add to factory
export const createApiSDK = (baseUrl: string): ApiSDK => ({
  // ... existing modules
  things: createThingSDK(baseUrl),
});
```

### 4. Export from `src/index.ts`

```typescript
export type {
  ThingSDK,
  ThingsResponse,
  CreateThingBody,
  CreateThingResponse,
} from "./client/thing.js";
```

### 5. Export schemas from `src/schemas/index.ts`

```typescript
export {
  GET_THINGS_ROUTE_SCHEMA,
  POST_THING_ROUTE_SCHEMA,
} from "./thing.schema.js";
```

### (Optional) 6. Add server route

```typescript
import { GET_THINGS_ROUTE_SCHEMA } from "@repo/server-sdk/schemas";
fastify.get("/things", {
  schema: GET_THINGS_ROUTE_SCHEMA,
  handler: async (
    request: FastifyRequest<{
      Body: FromSchema<typeof GET_THINGS_ROUTE_SCHEMA.body>;
      Querystring: FromSchema<typeof GET_THINGS_ROUTE_SCHEMA.querystring>;
    }>,
  ) => {
    const { page = 1, limit = 20, specialty, q } = request.query;
    const res = await getThings({ page, limit, specialty, q });
    return res;
  },
});
```

### (Optional) 7. Add dashboard hooks

```typescripttypescript
import { useQuery } from "@tanstack/react-query";
import { sdk } from "@repo/client";

export const useThings = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["things"],
    queryFn: () => sdk.things.list(),
    enabled: options?.enabled ?? true,
  });
};
```

## Adding methods to existing modules

1. Add route schema to `src/schemas/{domain}.schema.ts`
2. Add types + method to the SDK interface in `src/client/{domain}.ts`
3. Implement in the factory function
4. Export new types from `src/index.ts`
5. Export new schema from `src/schemas/index.ts`

## Error handling

All methods throw `ApiError` on non-2xx responses automatically via `apiFetch`. Consumers catch it:

```typescript
import { ApiError } from "@repo/server-sdk";

try {
  await sdk.things.create(body, token);
} catch (err) {
  if (err instanceof ApiError) {
    // err.statusCode, err.errorCode, err.message
  }
}
```

## Key files

| File                        | Purpose                                 |
| --------------------------- | --------------------------------------- |
| `src/sdk.ts`                | Factory + ApiSDK interface              |
| `src/index.ts`              | Main exports (factory, types, ApiError) |
| `src/client/fetcher.ts`     | `apiFetch` HTTP utility                 |
| `src/client/error.ts`       | `ApiError` class                        |
| `src/schemas/index.ts`      | Schema barrel export                    |
| `src/schemas/pagination.ts` | Shared pagination schemas               |
