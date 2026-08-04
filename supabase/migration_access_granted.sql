-- ============================================================================
-- Fires automatically whenever users.access_granted changes from anything
-- else to true - including a manual edit in Table Editor, exactly like the
-- workflow already in use. Calls app/api/webhooks/access-granted, which
-- sends the approval email (lib/email.js -> sendApprovalEmail).
--
-- Prerequisites, both one-time, done in the Supabase Dashboard:
--   1. Database -> Extensions -> enable "pg_net" (lets Postgres make HTTP
--      calls). Usually already on by default on newer projects.
--   2. Set DB_WEBHOOK_SECRET in your Vercel/hosting environment variables -
--      any random string, e.g. via `openssl rand -hex 32`. This is a
--      shared secret so nobody else can call your webhook route and
--      trigger fake approval emails.
--
-- Before running this file: replace YOUR_WEBHOOK_SECRET_HERE and the
-- commission.ng URL below with your real values. Do not commit the real
-- secret to git - this file is a template, not a source of truth for the
-- secret itself.
-- ============================================================================

create or replace function notify_access_granted() returns trigger as $$
begin
  if NEW.access_granted = true and (OLD.access_granted is distinct from true) then
    perform net.http_post(
      url := 'https://commission.ng/api/webhooks/access-granted',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', 'FhabLcfxAAhpVIFJWtArrCWuqr+C6y84rck='
      ),
      body := jsonb_build_object(
        'userId', NEW.id,
        'email', NEW.email,
        'fullName', NEW.full_name
      )
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_access_granted on users;
create trigger on_access_granted
  after update on users
  for each row
  execute function notify_access_granted();