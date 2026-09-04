"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Box, Typography, Paper, Stack, Button, Chip, CircularProgress, Dialog,
  DialogTitle, DialogContent, TextField, DialogActions,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";
import { useCurrentBusiness } from "@/lib/useCurrentBusiness";
import { createClient } from "@/lib/supabaseClient";

const STATUS_COLOR = { pending: "default", qr_ready: "warning", connected: "success", disconnected: "default", error: "error" };

export default function InboxConnectionsPage() {
  const { business } = useCurrentBusiness();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pairing, setPairing] = useState(false);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    if (!business) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("inbox_whatsapp_connections")
      .select("id, label, phone_number, status, qr_data")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });
    setConnections(data || []);
    setLoading(false);
  }, [business]);

  useEffect(() => { load(); }, [load]);

  // Poll while a connection is mid-pairing so the QR/status updates as the
  // worker service progresses through the handshake.
  useEffect(() => {
    const hasQrReady = connections.some((c) => c.status === "qr_ready");
    if (hasQrReady && !pollRef.current) {
      pollRef.current = setInterval(load, 2000);
    } else if (!hasQrReady && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [connections, load]);

  async function startNewConnection() {
    if (!business || !label.trim()) return;
    setCreating(true);
    const res = await fetch("/api/inbox/connections/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: business.id, label: label.trim() }),
    });
    setCreating(false);
    setLabel("");
    setPairing(false);
    if (res.ok) load();
  }

  if (loading || !business) {
    return <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}><CircularProgress size={24} /></Box>;
  }

  const qrConnection = connections.find((c) => c.status === "qr_ready");

  return (
    <>
      <PageHeader
        title="Connections"
        subtitle="Link the WhatsApp number your team replies from."
        action={<Button variant="contained" onClick={() => setPairing(true)}>Connect a number</Button>}
      />

      <Stack spacing={2}>
        {connections.map((conn) => (
          <Paper key={conn.id} elevation={0} sx={{ p: 2, border: `1px solid ${tokens.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <WhatsAppIcon sx={{ color: tokens.success }} />
              <Box>
                <Typography variant="body1" fontWeight={600}>{conn.label}</Typography>
                <Typography variant="body2" sx={{ color: tokens.muted }}>{conn.phone_number ?? "Not yet paired"}</Typography>
              </Box>
            </Stack>
            <Chip label={conn.status.replace("_", " ")} color={STATUS_COLOR[conn.status]} size="small" sx={{ textTransform: "capitalize" }} />
          </Paper>
        ))}

        {qrConnection && (
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${tokens.border}`, textAlign: "center" }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Open WhatsApp on your phone → Settings → Linked devices → Link a device, then scan:
            </Typography>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrConnection.qr_data} alt="WhatsApp pairing QR code" width={220} height={220} style={{ margin: "0 auto", display: "block" }} />
          </Paper>
        )}

        {connections.length === 0 && (
          <Typography sx={{ color: tokens.muted }}>No WhatsApp numbers connected yet.</Typography>
        )}
      </Stack>

      <Dialog open={pairing} onClose={() => setPairing(false)} fullWidth maxWidth="xs">
        <DialogTitle>Connect a WhatsApp number</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
            Give this line a name your team will recognize (e.g. &quot;Sales line&quot; or &quot;Support&quot;). You&apos;ll scan a QR
            code with WhatsApp on your phone next — exactly like linking WhatsApp Web.
          </Typography>
          <TextField label="Line name" value={label} onChange={(e) => setLabel(e.target.value)} fullWidth size="small" autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPairing(false)}>Cancel</Button>
          <Button variant="contained" disabled={creating || !label.trim()} onClick={startNewConnection}>
            {creating ? "Starting…" : "Continue"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
