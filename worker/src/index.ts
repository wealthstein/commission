import express from 'express';
import { startConnection } from './connectionManager';
import { startOutboundQueue } from './outboundQueue';
import { startLeadRouting } from './leadRouting';
import { startPresenceTracking } from './presenceTracker';
import { supabase } from './supabase';

const app = express();
app.use(express.json());

function requireInternalAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.INBOX_WORKER_INTERNAL_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Called by the main Commission app right after it inserts a new
// inbox_whatsapp_connections row (see app/api/inbox/connections/create).
app.post('/connections/:id/start', requireInternalAuth, async (req, res) => {
  try {
    await startConnection(req.params.id);
    res.json({ started: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

async function resumeExistingConnections() {
  const { data } = await supabase
    .from('inbox_whatsapp_connections')
    .select('id')
    .in('status', ['connected', 'disconnected']);

  for (const conn of data ?? []) {
    await startConnection(conn.id);
  }
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
  console.log(`Inbox worker listening on :${PORT}`);
  startOutboundQueue();
  startLeadRouting();
  await startPresenceTracking();
  await resumeExistingConnections();
});
