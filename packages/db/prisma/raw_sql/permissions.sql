-- PostgreSQL permission hardening for GDPR compliance
-- Enforce append-only on audit_logs and consent_records
-- Run after prisma db push: pnpm --filter @repo/db exec prisma db execute --file prisma/raw_sql/permissions.sql
--
-- PRODUCTION REQUIREMENT:
-- The ECS task MUST connect to this database with a least-privilege role
-- called `app_user` (not the superuser). The commands below revoke destructive
-- operations on the two append-only tables for that role.
--
-- In local development (superuser), REVOKE has no effect — the commands still
-- run without error so this file stays idempotent. Production enforcement
-- relies on the least-privilege role being the actual connector.
--
-- Create the role once (manual, out of band):
--   CREATE ROLE app_user WITH LOGIN PASSWORD '<from Secrets Manager>';
--   GRANT USAGE ON SCHEMA public TO app_user;
--   GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
--   GRANT DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- The REVOKEs below then carve out audit_logs and consent_records.

-- Audit logs: append-only — no UPDATE, no DELETE for app_user.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    REVOKE UPDATE, DELETE ON audit_logs FROM app_user;
  END IF;
END
$$;

-- Consent records: UPDATE allowed (for revocation via revokedAt), DELETE not.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    REVOKE DELETE ON consent_records FROM app_user;
  END IF;
END
$$;
