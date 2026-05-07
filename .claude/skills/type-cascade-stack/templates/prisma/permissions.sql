-- ISO 27001 A.8.15 / GDPR Art. 32 — append-only audit + consent.
-- Production must run the API as `app_user`, not the postgres superuser,
-- otherwise these REVOKEs have no effect.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    REVOKE UPDATE, DELETE ON audit_logs FROM app_user;
    REVOKE DELETE ON consent_records FROM app_user;
  END IF;
END
$$;
