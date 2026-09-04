import { supabase } from './supabase';
import { getOnlineMembers } from './presenceTracker';

export function startLeadRouting() {
  supabase
    .channel('inbox-lead-routing')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'inbox_conversations' },
      async (payload) => {
        const conversation = payload.new as any;
        if (conversation.assigned_to) return;
        await routeConversation(conversation);
      }
    )
    .subscribe();
}

async function routeConversation(conversation: { id: string; business_id: string }) {
  const { data: rules } = await supabase
    .from('inbox_routing_rules')
    .select('*')
    .eq('business_id', conversation.business_id)
    .eq('is_active', true)
    .order('priority', { ascending: true });

  if (!rules || rules.length === 0) return;

  for (const rule of rules) {
    const assignee = await evaluateRule(rule, conversation);
    if (assignee) {
      await supabase.from('inbox_conversations').update({ assigned_to: assignee }).eq('id', conversation.id);
      return;
    }
  }
}

async function evaluateRule(rule: any, conversation: { id: string; business_id: string }): Promise<string | null> {
  if (rule.type === 'keyword') {
    const { data: firstMessage } = await supabase
      .from('inbox_messages')
      .select('content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    const keywords: string[] = rule.config?.keywords ?? [];
    const assignTo: string | undefined = rule.config?.assign_to;
    const text = (firstMessage?.content ?? '').toLowerCase();

    if (assignTo && keywords.some((k) => text.includes(k.toLowerCase()))) return assignTo;
    return null;
  }

  if (rule.type === 'round_robin') {
    const memberIds: string[] = rule.config?.member_ids ?? (await activeMemberIds(conversation.business_id));
    if (memberIds.length === 0) return null;

    const lastIndex: number = rule.config?.last_index ?? -1;
    const nextIndex = (lastIndex + 1) % memberIds.length;

    await supabase
      .from('inbox_routing_rules')
      .update({ config: { ...rule.config, last_index: nextIndex, member_ids: memberIds } })
      .eq('id', rule.id);

    return memberIds[nextIndex];
  }

  if (rule.type === 'first_available') {
    const allMembers: string[] = rule.config?.member_ids ?? (await activeMemberIds(conversation.business_id));
    const online = getOnlineMembers(conversation.business_id);
    const candidates = allMembers.filter((id) => online.has(id));
    const memberIds = candidates.length > 0 ? candidates : allMembers;
    if (memberIds.length === 0) return null;

    const { data: openCounts } = await supabase
      .from('inbox_conversations')
      .select('assigned_to')
      .eq('business_id', conversation.business_id)
      .eq('status', 'open')
      .in('assigned_to', memberIds);

    const counts = new Map<string, number>(memberIds.map((id: string) => [id, 0]));
    for (const row of openCounts ?? []) {
      if (row.assigned_to) counts.set(row.assigned_to, (counts.get(row.assigned_to) ?? 0) + 1);
    }

    return [...counts.entries()].sort((a, b) => a[1] - b[1])[0][0];
  }

  return null;
}

/**
 * "Active members" of a business = the owner, plus anyone with an active
 * business_team_members row - the same membership model is_business_member()
 * uses in the SQL RLS policies (see migration_inbox.sql).
 */
async function activeMemberIds(businessId: string): Promise<string[]> {
  const { data: business } = await supabase.from('core_businesses').select('owner_id').eq('id', businessId).single();
  const { data: team } = await supabase
    .from('core_business_team_members')
    .select('user_id')
    .eq('business_id', businessId)
    .eq('status', 'active');

  const ids = new Set<string>();
  if (business?.owner_id) ids.add(business.owner_id);
  for (const row of team ?? []) {
    if (row.user_id) ids.add(row.user_id);
  }
  return [...ids];
}
