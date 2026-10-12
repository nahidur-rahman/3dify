-- Run once in Supabase SQL Editor after the OTP migration.
-- Supabase supports pg_cron; this removes expired digests even when the app is idle.
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule(
  '3dify-admin-auth-cleanup',
  '* * * * *',
  $$DELETE FROM public.admin_login_challenges WHERE "id" IN (
      SELECT "id" FROM public.admin_login_challenges
      WHERE "expiresAt" <= timezone('UTC', clock_timestamp()) FOR UPDATE SKIP LOCKED
    );
    DELETE FROM public.admin_auth_rate_limits WHERE "key" IN (
      SELECT "key" FROM public.admin_auth_rate_limits
      WHERE "windowEndsAt" <= timezone('UTC', clock_timestamp()) FOR UPDATE SKIP LOCKED
    );$$
);
