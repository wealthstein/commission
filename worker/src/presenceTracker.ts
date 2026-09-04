import { supabase } from './supabase';

// Joins the same presence channel the dashboard uses (inbox-presence:<businessId>)
// purely as an observer - never calls track() itself.
const onlineByBusiness = new Map<string, Set<string>>();

export function getOnlineMembers(businessId: string): Set<string> {
  return onlineByBusiness.get(businessId) ?? new Set();
}

function watchBusinessPresence(businessId: string) {
  if (onlineByBusiness.has(businessId)) return;
  onlineByBusiness.set(businessId, new Set());

  const channel = supabase.channel(`inbox-presence:${businessId}`);
  channel
    .on('presence', { event: 'sync' }, () => {
      onlineByBusiness.set(businessId, new Set(Object.keys(channel.presenceState())));
    })
    .subscribe();
}

export async function startPresenceTracking() {
  const { data: businesses } = await supabase.from('core_businesses').select('id');
  for (const business of businesses ?? []) {
    watchBusinessPresence(business.id);
  }

  supabase
    .channel('inbox-presence-business-watcher')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'businesses' },
      (payload) => watchBusinessPresence((payload.new as any).id)
    )
    .subscribe();
}
