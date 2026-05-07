# Architecture — Type Cascade

The type cascade is the single load-bearing idea: **change a JSON Schema, and the TypeScript compiler shows you every server handler and every dashboard hook that needs updating, before any code runs**. There are no parallel interfaces, no mapper layers, no DTO classes. The schema is the contract; everything else is derived.

## The cascade

```
packages/db/prisma/schema.prisma          ← DB shape (Prisma generates @repo/db types)
            │
            ▼
packages/server-sdk/src/schemas/*.ts      ← JSON Schema (single source of truth)
            │
            ├──► packages/server-sdk/src/client/*.ts   ← typed SDK fetcher
            │            │
            │            ▼
            │    apps/dashboard/**                     ← React imports SDK types directly
            │
            └──► apps/server/src/routes/<domain>/...   ← Fastify imports schemas + FromSchema
```

A breakage in `schema.ts` cascades up (services using the wrong field), down (Prisma mismatch surfaces in service), and sideways (dashboard hook fails to compile). One change, all consumers known at build time.

## File layout

```
my-project/
├── apps/
│   ├── server/                 # Fastify 5 API (port 3000)
│   │   └── src/
│   │       ├── app.ts                  # Fastify app factory
│   │       ├── index.ts                # Boot + close-with-grace
│   │       ├── plugins/                # auth-guard, error-handler, consent-guard, helmet, rate-limit, cors
│   │       ├── routes/<domain>/
│   │       │   ├── <domain>.module.ts  # Fastify plugin: registers routes
│   │       │   ├── <domain>.schema.ts  # OPTIONAL re-export from SDK
│   │       │   └── <domain>.service.ts # Business logic, throws HttpErrorResponse
│   │       ├── services/               # cross-domain (audit-log, consent, realtime-manager)
│   │       └── lib/                    # crypto helpers, db, email, s3
│   └── dashboard/              # Vite + React + TanStack Router/Query (port 5173)
│       └── src/
│           ├── routes/                 # file-based routes
│           ├── hooks/<domain>/
│           │   ├── <domain>.keys.ts    # query keys
│           │   └── use-<domain>.ts     # hooks calling sdk.<domain>.*
│           ├── components/<domain>/
│           ├── lib/<feature>/          # pure helpers (formatters, predicates) + co-located .test.ts
│           └── lib/api/client.ts       # SDK instance + auth transport
├── packages/
│   ├── server-sdk/             # JSON Schemas + typed fetch client
│   │   └── src/
│   │       ├── schemas/<domain>.schema.ts
│   │       ├── client/<domain>.ts
│   │       └── client/fetcher.ts       # apiFetch with auth/error mapping
│   ├── db/                     # Prisma + raw_sql/triggers.sql + raw_sql/permissions.sql
│   ├── crypto/                 # AES-256-GCM, encryptJson, signWebhookBody, hashIp, timingSafeEquals
│   ├── eslint-config/
│   └── typescript-config/
├── docker-compose.yml          # Postgres only
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Schema example (the load-bearing pattern)

```ts
// packages/server-sdk/src/schemas/event.schema.ts
import { FromSchema } from "json-schema-to-ts";

export const POST_EVENT_ROUTE_SCHEMA = {
  body: {
    type: "object",
    required: ["title", "date"],
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 1, maxLength: 200 },
      date: { type: "string", format: "date-time" },
      capacity: { type: ["integer", "null"], minimum: 1 },
    },
  },
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["id", "title", "date"],
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        date: { type: "string", format: "date-time" },
        capacity: { type: ["integer", "null"] },
      },
    },
  },
} as const;

export type CreateEventBody = FromSchema<typeof POST_EVENT_ROUTE_SCHEMA.body>;
export type EventResponse = FromSchema<(typeof POST_EVENT_ROUTE_SCHEMA.response)[200]>;
```

## Module example

```ts
// apps/server/src/routes/events/events.module.ts
import { FromSchema } from "json-schema-to-ts";
import { POST_EVENT_ROUTE_SCHEMA } from "@repo/server-sdk/schemas";
import { createEvent } from "./events.service.js";

export default async (fastify: FastifyInstance) => {
  fastify.post<{
    Body: FromSchema<typeof POST_EVENT_ROUTE_SCHEMA.body>;
    Reply: FromSchema<(typeof POST_EVENT_ROUTE_SCHEMA.response)[200]>;
  }>("/", {
    schema: POST_EVENT_ROUTE_SCHEMA,
    preHandler: [fastify.authenticate, fastify.consentGuard(["terms_of_service"])],
    config: { audit: { entity: "event", action: "create" } },
    handler: async (request) => createEvent(request.user.id, request.body),
  });
};
```

## Service example (encrypts at the boundary)

```ts
// apps/server/src/routes/events/events.service.ts
import { encryptJson, decryptJson } from "@repo/crypto";
import { getPrismaClient } from "@repo/db";
import type { CreateEventBody, EventResponse } from "@repo/server-sdk/schemas";
import { HttpErrorResponse } from "../../plugins/error-handler.plugin.js";

export class EventError extends HttpErrorResponse {}

export const createEvent = async (
  userId: string,
  body: CreateEventBody,
): Promise<EventResponse> => {
  const row = await getPrismaClient().event.create({
    data: { userId, title: body.title, date: new Date(body.date), capacity: body.capacity ?? null },
  });
  return { id: row.id, title: row.title, date: row.date.toISOString(), capacity: row.capacity };
};
```

## Dashboard hook example

```ts
// apps/dashboard/src/hooks/events/use-events.ts
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "@/lib/api/client";
import type { CreateEventBody } from "@repo/server-sdk/schemas";  // <- same type
import { eventKeys } from "./events.keys";

export const eventsQuery = () =>
  queryOptions({ queryKey: eventKeys.all, queryFn: () => sdk.events.list() });

export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateEventBody) => sdk.events.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  });
};
```

`CreateEventBody` is the SAME type the server's handler validates — change `body.title.maxLength` from 200 to 100 and the dashboard form's TS check still passes (length is runtime-validated), but adding a required field breaks both compiler outputs simultaneously.

## Why no mappers

A `mapEventEntityToDto(row)` function is a silent contract drift surface. If `row.capacity` becomes `Capacity?` in Prisma but the mapper still returns `number`, the runtime crash is a `TypeError` from `null` passing through `JSON.stringify`. With direct return + `FromSchema`, that mismatch is a TypeScript error in the service file the moment Prisma regenerates.

The only "mapping" that's allowed: decrypting an encrypted column inside the service before returning, because the schema says `notes: string` and the DB row has `encryptedNotes: string`. That decrypt happens at the boundary; the function still returns the SDK shape directly.

## Error envelope

`HttpErrorResponse` (defined in `error-handler.plugin.ts`) is the single error type services throw. Subclasses carry domain context but the shape is fixed:

```json
{ "code": "EVENT_FULL", "message": "...", "details": { "retryAfterSeconds": 60 } }
```

Error codes live in `packages/server-sdk/src/schemas/error-codes.ts` so the dashboard can switch on them in toast handlers.

## Pagination envelope

Every list response is `{ data: T[], pagination: { page, limit, total, totalPages } }`. Schema in `packages/server-sdk/src/schemas/pagination.ts`. Don't invent ad-hoc pagination shapes.

## Backend tests

Use `node:test` + `tsx` with `mock.module()` declared BEFORE the dynamic import of the module under test. See `templates/domain-module/example.service.test.ts` for the canonical pattern. Backend tests are bullet-proof, dashboards are visual-only via Storybook + Vitest for pure helpers in `lib/<feature>/`.
