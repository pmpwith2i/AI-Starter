-- Realtime PG triggers — emits LISTEN/NOTIFY events consumed by the
-- server's RealtimeManager and broadcast over WebSocket to dashboard subscribers.
--
-- Idempotent: every block is DROP IF EXISTS + CREATE.
--
-- Apply: pnpm --filter @repo/db exec prisma db execute --file prisma/raw_sql/triggers.sql
--
-- Topic naming: <table_name>:user:<userId> (single load-bearing surface for now).
-- Add a DROP+CREATE pair for every new realtime-aware table.

CREATE OR REPLACE FUNCTION realtime_notify() RETURNS trigger AS $$
DECLARE
  payload jsonb;
  topic text;
  user_id_value text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    user_id_value := OLD.user_id::text;
    payload := jsonb_build_object(
      'op', TG_OP, 'table', TG_TABLE_NAME,
      'id', OLD.id, 'userId', user_id_value
    );
  ELSE
    user_id_value := NEW.user_id::text;
    payload := jsonb_build_object(
      'op', TG_OP, 'table', TG_TABLE_NAME,
      'id', NEW.id, 'userId', user_id_value
    );
  END IF;

  topic := TG_TABLE_NAME || ':user:' || user_id_value;
  PERFORM pg_notify('realtime', jsonb_build_object('topic', topic, 'payload', payload)::text);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Notification trigger (starter realtime example).
DROP TRIGGER IF EXISTS realtime_notify_notifications ON notifications;
CREATE TRIGGER realtime_notify_notifications
AFTER INSERT OR UPDATE OR DELETE ON notifications
FOR EACH ROW EXECUTE FUNCTION realtime_notify();
