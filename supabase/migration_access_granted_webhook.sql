-- Fires automatically whenever users.access_granted changes to true.
-- Fixed to use www.commission.ng (your canonical domain - commission.ng
-- redirects to it, and pg_net does not reliably follow redirects on POST).
--
-- Before running: replace YOUR_WEBHOOK_SECRET_HERE with your real
-- DB_WEBHOOK_SECRET value (same one already in Vercel). Do not commit the
-- real secret to git - this file is a template.

create or replace function notify_access_granted() returns trigger as $$
begin
  if NEW.access_granted = true and (OLD.access_granted is distinct from true) then
    perform net.http_post(
      url := 'https://www.commission.ng/api/webhooks/access-granted',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', 'YOUR_WEBHOOK_SECRET_HERE'
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
