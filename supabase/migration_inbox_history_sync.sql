-- ============================================================================
-- Fixes inbox_touch_conversation_on_message for history-sync support.
-- Run any time after migration_inbox.sql (order relative to the core
-- rename doesn't matter - this only touches inbox_ tables, already
-- correctly named either way).
--
-- Two problems the original trigger has once messages can arrive in bulk
-- (history sync) instead of strictly one at a time, live, in order:
--
-- 1. It bumped unread_count for every inbound insert, including years-old
--    historical messages someone already read on their phone long before
--    ever linking Inbox - connecting a number would show a huge fake
--    unread count from day one.
-- 2. It unconditionally overwrote last_message_at/preview on every insert.
--    If historical messages ever arrive slightly out of order (or a live
--    message and a history-sync batch race each other), an older message
--    inserted after a newer one would incorrectly stomp the preview back
--    to something stale.
-- ============================================================================

create or replace function inbox_touch_conversation_on_message()
returns trigger language plpgsql as $$
begin
  update inbox_conversations
  set last_message_at = new.created_at,
      last_message_preview = left(coalesce(new.content, '[' || new.type || ']'), 120),
      unread_count = case
        when new.direction = 'inbound' and new.status != 'read' then unread_count + 1
        else unread_count
      end
  where id = new.conversation_id
    and (last_message_at is null or new.created_at >= last_message_at);
  return new;
end;
$$;
