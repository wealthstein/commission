import webpush from 'web-push';
import { supabase } from './supabase';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:support@example.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function notifyNewMessage(businessId: string, conversationId: string, contactName: string, preview: string) {
  const { data: conversation } = await supabase
    .from('inbox_conversations')
    .select('assigned_to')
    .eq('id', conversationId)
    .single();

  let recipientIds: string[];
  if (conversation?.assigned_to) {
    recipientIds = [conversation.assigned_to];
  } else {
    const { data: business } = await supabase.from('core_businesses').select('owner_id').eq('id', businessId).single();
    const { data: team } = await supabase
      .from('core_business_team_members')
      .select('user_id')
      .eq('business_id', businessId)
      .eq('status', 'active');
    const ids = new Set<string>();
    if (business?.owner_id) ids.add(business.owner_id);
    for (const row of team ?? []) if (row.user_id) ids.add(row.user_id);
    recipientIds = [...ids];
  }

  if (recipientIds.length === 0) return;

  const { data: subscriptions } = await supabase
    .from('inbox_push_subscriptions')
    .select('*')
    .in('user_id', recipientIds);

  if (!subscriptions || subscriptions.length === 0) return;

  // Generic {title, body, url, tag} contract - the service worker
  // (pwa/custom-sw.js) is site-wide infrastructure, not Inbox-specific, so
  // it stays agnostic about what sent the push; Inbox is just the first
  // caller. tag=conversationId collapses repeat notifications from the
  // same chat instead of stacking them.
  const payload = JSON.stringify({
    title: contactName,
    body: preview.slice(0, 120),
    url: `/dashboard/inbox?conversation=${conversationId}`,
    tag: conversationId,
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys as any }, payload);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('inbox_push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('Push send failed', err.statusCode, err.body);
        }
      }
    })
  );
}
