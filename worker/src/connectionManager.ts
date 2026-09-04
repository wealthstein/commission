import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
  WASocket,
} from '@whiskeysockets/baileys';
import { randomUUID } from 'crypto';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { supabase } from './supabase';
import { notifyNewMessage } from './pushNotifications';

// Uses Baileys (an unofficial, reverse-engineered WhatsApp Web client), not
// WhatsApp's official Business API, per the product requirement to avoid
// the official API/third-party BSPs entirely. Each connected number is
// exposed to WhatsApp's normal ban-detection for automated clients - keep
// send volume/rate human-like. Sendchamp/SMS stays untouched for OTP
// specifically (see lib/sendchamp.js in the main app) - this worker never
// touches phone verification.

const AUTH_DIR = process.env.AUTH_STORAGE_DIR || path.join(__dirname, '..', 'sessions');
const logger = pino({ level: 'warn' });

const activeSockets = new Map<string, WASocket>();

// Reconnect attempt count per connection, for exponential backoff. Reset to
// 0 whenever a connection successfully reaches 'open'.
const reconnectAttempts = new Map<string, number>();
const MAX_RECONNECT_ATTEMPTS = 8; // ~3s, 6s, 12s, 24s, 48s, 96s, 192s, 384s (~13 min total) before giving up
const BASE_RECONNECT_DELAY_MS = 3000;

// Disconnect reasons that mean "this session cannot recover on its own" -
// retrying forever against these wastes resources and, worse, hammers
// WhatsApp's servers with reconnect attempts on an already-broken or
// banned session, which is the opposite of what a ban-risk-conscious
// integration should do. All of these get status='error' immediately
// (no retry), surfacing to the business that the number needs re-pairing
// or investigation rather than silently retrying forever in the
// background:
//   loggedOut            - the user unlinked the device from their phone
//   forbidden             - banned by WhatsApp
//   badSession             - corrupted session, needs a fresh QR pairing
//   multideviceMismatch    - structural incompatibility, won't self-resolve
//   connectionReplaced     - another connection took over these same
//                            credentials elsewhere; blindly reconnecting
//                            would likely just get kicked again by
//                            whatever replaced it (or cause the two to
//                            flap against each other)
const PERMANENT_DISCONNECT_REASONS = new Set<number>([
  DisconnectReason.loggedOut,
  DisconnectReason.forbidden,
  DisconnectReason.badSession,
  DisconnectReason.multideviceMismatch,
  DisconnectReason.connectionReplaced,
]);

function authDirFor(connectionId: string) {
  const dir = path.join(AUTH_DIR, connectionId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function startConnection(connectionId: string) {
  if (activeSockets.has(connectionId)) return;

  const { state, saveCreds } = await useMultiFileAuthState(authDirFor(connectionId));
  const { version } = await fetchLatestBaileysVersion();

  const socket = makeWASocket({ version, auth: state, logger, printQRInTerminal: false });
  activeSockets.set(connectionId, socket);

  socket.ev.on('creds.update', saveCreds);

  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      const qrDataUrl = await QRCode.toDataURL(qr);
      await supabase
        .from('inbox_whatsapp_connections')
        .update({ status: 'qr_ready', qr_data: qrDataUrl })
        .eq('id', connectionId);
    }

    if (connection === 'open') {
      reconnectAttempts.delete(connectionId); // fresh backoff count for next time something goes wrong
      const phoneNumber = socket.user?.id?.split(':')[0] ?? null;
      await supabase
        .from('inbox_whatsapp_connections')
        .update({ status: 'connected', phone_number: phoneNumber, qr_data: null, last_seen_at: new Date().toISOString() })
        .eq('id', connectionId);
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const isPermanent = statusCode !== undefined && PERMANENT_DISCONNECT_REASONS.has(statusCode);
      // restartRequired is Baileys explicitly telling us to reconnect right
      // now as a normal step (commonly right after a QR scan completes) -
      // not a failure signal, so it skips the backoff/attempt-count
      // machinery entirely rather than making someone who just scanned a
      // QR code wait several seconds for what should be near-instant.
      const isExpectedRestart = statusCode === DisconnectReason.restartRequired;

      if (isExpectedRestart) {
        activeSockets.delete(connectionId);
        setTimeout(() => startConnection(connectionId), 300);
        return;
      }

      const attempts = reconnectAttempts.get(connectionId) ?? 0;
      const exhaustedRetries = attempts >= MAX_RECONNECT_ATTEMPTS;
      const shouldReconnect = !isPermanent && !exhaustedRetries;

      await supabase
        .from('inbox_whatsapp_connections')
        .update({ status: shouldReconnect ? 'disconnected' : 'error' })
        .eq('id', connectionId);

      activeSockets.delete(connectionId);

      if (shouldReconnect) {
        reconnectAttempts.set(connectionId, attempts + 1);
        const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, attempts); // 3s, 6s, 12s, 24s, ...
        setTimeout(() => startConnection(connectionId), delay);
      } else {
        reconnectAttempts.delete(connectionId);
        if (exhaustedRetries) {
          console.error(`Connection ${connectionId} gave up reconnecting after ${MAX_RECONNECT_ATTEMPTS} attempts`);
        }
      }
    }
  });

  socket.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      await handleInboundMessage(connectionId, msg);
    }
  });

  return socket;
}

async function handleInboundMessage(connectionId: string, msg: any) {
  const { data: connection } = await supabase
    .from('inbox_whatsapp_connections')
    .select('business_id')
    .eq('id', connectionId)
    .single();
  if (!connection) return;

  const waNumber = msg.key.remoteJid?.split('@')[0];
  if (!waNumber) return;

  const pushName: string | undefined = msg.pushName;
  const text: string | undefined =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    msg.message.imageMessage?.caption ||
    undefined;

  const mediaType = Object.keys(msg.message)[0];
  const type = mediaType.includes('image') ? 'image'
    : mediaType.includes('video') ? 'video'
    : mediaType.includes('audio') ? 'audio'
    : mediaType.includes('document') ? 'document'
    : mediaType.includes('sticker') ? 'sticker'
    : 'text';

  const { data: contact } = await supabase
    .from('inbox_contacts')
    .upsert(
      { business_id: connection.business_id, wa_number: waNumber, name: pushName ?? null },
      { onConflict: 'business_id,wa_number', ignoreDuplicates: false }
    )
    .select()
    .single();

  const { data: conversation } = await supabase
    .from('inbox_conversations')
    .upsert(
      { business_id: connection.business_id, connection_id: connectionId, contact_id: contact!.id, status: 'open' },
      { onConflict: 'connection_id,contact_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  let mediaUrl: string | null = null;
  let mediaMimeType: string | null = null;

  if (type !== 'text') {
    try {
      const buffer = (await downloadMediaMessage(msg, 'buffer', {}, { logger, reuploadRequest: undefined as any })) as Buffer;
      const mimeType: string = msg.message[`${type}Message`]?.mimetype || 'application/octet-stream';
      const extension = mimeType.split('/')[1]?.split(';')[0] || 'bin';
      const storagePath = `${connection.business_id}/${conversation!.id}/${randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('inbox-media')
        .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

      if (!uploadError) {
        const { data: publicUrl } = supabase.storage.from('inbox-media').getPublicUrl(storagePath);
        mediaUrl = publicUrl.publicUrl;
        mediaMimeType = mimeType;
      } else {
        console.error('Media upload failed', uploadError);
      }
    } catch (err) {
      console.error('Media download failed', err);
    }
  }

  await supabase.from('inbox_messages').insert({
    business_id: connection.business_id,
    conversation_id: conversation!.id,
    direction: 'inbound',
    type,
    content: text ?? null,
    media_url: mediaUrl,
    media_mime_type: mediaMimeType,
    wa_message_id: msg.key.id,
    status: 'delivered',
  });

  await notifyNewMessage(connection.business_id, conversation!.id, contact?.name || waNumber, text || `Sent a ${type}`)
    .catch((err) => console.error('Push notification failed', err));
}

export async function sendOutboundMessage(connectionId: string, waNumber: string, text: string) {
  const socket = activeSockets.get(connectionId);
  if (!socket) throw new Error(`No active socket for connection ${connectionId}`);
  const jid = `${waNumber}@s.whatsapp.net`;
  const result = await socket.sendMessage(jid, { text });
  return result?.key?.id ?? null;
}

export function isConnected(connectionId: string) {
  return activeSockets.has(connectionId);
}
