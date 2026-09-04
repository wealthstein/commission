import { supabase } from './supabase';
import { sendOutboundMessage, isConnected } from './connectionManager';

// The Next.js app inserts inbox_messages rows with status='pending' when an
// agent hits send. This relays each pending outbound row through the
// matching Baileys socket.
export function startOutboundQueue() {
  supabase
    .channel('inbox-outbound-messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'inbox_messages', filter: 'direction=eq.outbound' },
      async (payload) => {
        const message = payload.new as any;
        if (message.status !== 'pending') return;
        await relay(message);
      }
    )
    .subscribe();

  sweepPending();
}

async function sweepPending() {
  const { data: pending } = await supabase
    .from('inbox_messages')
    .select('*')
    .eq('direction', 'outbound')
    .eq('status', 'pending');

  for (const message of pending ?? []) {
    await relay(message);
  }
}

async function relay(message: any) {
  const { data: conversation } = await supabase
    .from('inbox_conversations')
    .select('connection_id, contact:inbox_contacts(wa_number)')
    .eq('id', message.conversation_id)
    .single();

  if (!conversation) return;

  const connectionId = conversation.connection_id;
  const waNumber = (conversation.contact as any)?.wa_number;

  if (!isConnected(connectionId)) {
    await supabase.from('inbox_messages').update({ status: 'failed' }).eq('id', message.id);
    return;
  }

  try {
    const waMessageId = await sendOutboundMessage(connectionId, waNumber, message.content);
    await supabase.from('inbox_messages').update({ status: 'sent', wa_message_id: waMessageId }).eq('id', message.id);
  } catch (err) {
    console.error('Failed to send message', message.id, err);
    await supabase.from('inbox_messages').update({ status: 'failed' }).eq('id', message.id);
  }
}
