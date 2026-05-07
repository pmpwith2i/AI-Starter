-- Idempotent: DROP IF EXISTS + CREATE for every trigger.
-- Apply: pnpm --filter @repo/db exec prisma db execute --file prisma/raw_sql/triggers.sql

CREATE OR REPLACE FUNCTION realtime_notify() RETURNS trigger AS $$
DECLARE
  payload jsonb;
  topic text;
  user_id_value text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    user_id_value := OLD.user_id::text;
    payload := jsonb_build_object('op', TG_OP, 'table', TG_TABLE_NAME, 'id', OLD.id, 'userId', user_id_value);
  ELSE
    user_id_value := NEW.user_id::text;
    payload := jsonb_build_object('op', TG_OP, 'table', TG_TABLE_NAME, 'id', NEW.id, 'userId', user_id_value);
  END IF;

  topic := TG_TABLE_NAME || ':user:' || user_id_value;
  PERFORM pg_notify('realtime', jsonb_build_object('topic', topic, 'payload', payload)::text);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add a DROP+CREATE pair for every realtime-aware table below:
-- Example:
-- DROP TRIGGER IF EXISTS realtime_notify_events ON events;
-- CREATE TRIGGER realtime_notify_events
-- AFTER INSERT OR UPDATE OR DELETE ON events
-- FOR EACH ROW EXECUTE FUNCTION realtime_notify();
