# Realtime — PG triggers + WebSocket + invalidation map

Every new model gets realtime support. The pipeline: Prisma write → PG trigger fires `pg_notify` → server `RealtimeManager` listens on a single connection → broadcasts to authorized WebSocket subscribers → dashboard's `useRealtime` hook invalidates TanStack Query caches → `useQuery` refetches.

## Trigger template

```sql
-- packages/db/prisma/raw_sql/triggers.sql
-- This file is idempotent: DROP IF EXISTS + CREATE for every trigger.
-- Apply: pnpm --filter @repo/db exec prisma db execute --file prisma/raw_sql/triggers.sql

CREATE OR REPLACE FUNCTION realtime_notify() RETURNS trigger AS $$
DECLARE
  payload jsonb;
  topic text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    payload := jsonb_build_object(
      'op', TG_OP, 'table', TG_TABLE_NAME,
      'id', OLD.id,
      'userId', OLD.user_id
    );
    topic := TG_TABLE_NAME || ':user:' || OLD.user_id;
  ELSE
    payload := jsonb_build_object(
      'op', TG_OP, 'table', TG_TABLE_NAME,
      'id', NEW.id,
      'userId', NEW.user_id
    );
    topic := TG_TABLE_NAME || ':user:' || NEW.user_id;
  END IF;

  PERFORM pg_notify('realtime', jsonb_build_object('topic', topic, 'payload', payload)::text);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS realtime_notify_events ON events;
CREATE TRIGGER realtime_notify_events
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH ROW EXECUTE FUNCTION realtime_notify();
```

**Rules**:
- Trigger name: `realtime_notify_<table_name>`. Composite-PK join tables CANNOT use this trigger because `realtime_notify()` references `NEW.id` — emit via the parent table instead.
- The function must be column-aware to the snake_case naming Prisma uses (`@map`).
- The `topic` is the public contract surface: `<entity>:<scope>:<scopeId>`. Examples: `events:user:cuid…`, `task:user:cuid…`, `chat:conversation:cuid…`, `professional:event:profileId…`. Pick the smallest scope you can authorize against.

## Realtime manager (server)

```ts
// apps/server/src/services/realtime-manager.ts (excerpt)
import { Client } from "pg";

const subscriptions = new Map<string, Set<WebSocket>>();

const isAuthorized = (userId: string, role: string, topic: string): boolean => {
  if (topic.startsWith(`task:user:${userId}`)) return true;
  if (topic.startsWith(`events:user:${userId}`)) return true;
  if (topic.startsWith(`chat:conversation:`)) {
    // verify ownership in DB
  }
  return false;
};

export const startRealtimeManager = async (server: FastifyInstance) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query("LISTEN realtime");
  client.on("notification", (msg) => {
    const { topic, payload } = JSON.parse(msg.payload!);
    const subs = subscriptions.get(topic);
    subs?.forEach((ws) => ws.send(JSON.stringify({ topic, payload })));
  });
};
```

The `isAuthorized` switch is the full surface for topic auth. Add a case for every new topic type. Reject unauthorized subscribe attempts at the WebSocket handshake — never trust the client's claim.

## WebSocket auth — ticket flow

The dashboard issues a one-time ticket via `POST /realtime/ticket` (30s TTL) and uses it in the WS handshake `?ticket=…`. The old `?token=<jwt>` query-string flow is forbidden because access tokens leak in browser histories and proxy logs.

## Dashboard hook + invalidation map

```ts
// apps/dashboard/src/hooks/realtime/use-realtime.ts
export const useRealtime = (topics: string[]) => {
  // opens WS, subscribes to topics, on message looks up invalidationMap[entity]
  // and calls qc.invalidateQueries({ queryKey })
};

// apps/dashboard/src/hooks/realtime/invalidation-map.ts
export const invalidationMap: Record<string, QueryKey[]> = {
  events: [eventKeys.all],
  task: [taskKeys.all, nutritionKeys.plans],
  chat: [chatKeys.conversationsAll],
  // …
};
```

Global subscriptions (per-user, always-on) live in `routes/_auth.tsx` — typically `task:user:{userId}`, `notification:user:{userId}`, `events:user:{userId}`, `credits:user:{userId}`. Per-conversation subscriptions are mounted by the relevant route component and torn down on unmount.

## When NOT to add realtime

- **Public editorial / read-mostly / SSR-cached** content (e.g. blog posts on a marketing site rendered with ISR). Document the exception in CLAUDE.md so future contributors don't re-add a trigger.
- **Composite-PK join tables without an `id` column** — the broadcast happens via the parent entity's trigger.

## Checklist for a new realtime feature

- [ ] Trigger in `triggers.sql` with `DROP IF EXISTS` + `CREATE`.
- [ ] Trigger applied: `pnpm --filter @repo/db exec prisma db execute --file prisma/raw_sql/triggers.sql`.
- [ ] Topic naming follows `<entity>:<scope>:<scopeId>`.
- [ ] `isAuthorized()` in `realtime-manager.ts` extended with the new topic case.
- [ ] Topic types added to `packages/server-sdk/src/schemas/realtime.ts`.
- [ ] `invalidationMap` in dashboard updated with the entity → query-keys mapping.
- [ ] Global subscription added in `routes/_auth.tsx` if the topic is per-user always-on.
