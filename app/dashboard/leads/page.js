"use client";

import { useState } from "react";
import { Paper, Box, Typography, Chip, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from "@mui/material";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";

// Production query: supabase.from("affiliate_leads").select("*, affiliate_programs(*, affiliate_campaigns(name, core_businesses(id, owner_id)))")
//   .in("affiliate_programs.products.business_id", myBusinessIds).order("created_at", { ascending: false })
//
// Note there is no name/phone/email field to select - Commission never
// stores a lead's identity (see supabase/schema.sql). Full details for a
// qualified lead were already forwarded to this business's own email or
// webhook the moment it qualified (see lib/leadForwarding.js).
const sampleLeads = [
  { id: "l1", whatsapp_ref: "LD-7F3K9Q", status: "captured", product: "CareLink HMO Plan", created_at: "2026-07-28" },
  { id: "l2", whatsapp_ref: "LD-2M8XJZ", status: "qualified", product: "CareLink HMO Plan", created_at: "2026-07-26", charge_amount_naira: 5000 },
  { id: "l3", whatsapp_ref: "LD-9RT4WP", status: "rejected", product: "SwiftHR Payroll", created_at: "2026-07-24" },
];

const STATUS_STYLE = {
  captured: { bg: "#FFF3C4", fg: tokens.brandInk, label: "Awaiting qualification" },
  qualified: { bg: "#E7F5EE", fg: tokens.success, label: "Qualified" },
  rejected: { bg: "#F1EFE7", fg: tokens.muted, label: "Rejected" },
};

function QualifyDialog({ lead, open, onClose, onDone }) {
  const [state, setState] = useState({ loading: false, error: null });

  async function handleDecision(approve) {
    setState({ loading: true, error: null });
    try {
      const res = await fetch(`/api/leads/${lead.id}/qualify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update lead");
      setState({ loading: false, error: null });
      onDone(data);
      onClose();
    } catch (err) {
      setState({ loading: false, error: err.message });
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Qualify lead {lead?.whatsapp_ref}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
          Use this if you are qualifying a lead based on your own WhatsApp conversation, rather than the prospect
          completing Commission&apos;s hosted form themselves. Confirming charges your Campaign Wallet for this
          program&apos;s cost per qualified lead and pays your affiliates automatically.
        </Typography>
        {state.error && <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={() => handleDecision(false)} disabled={state.loading} color="inherit">
          Reject
        </Button>
        <Button onClick={() => handleDecision(true)} disabled={state.loading} variant="contained">
          {state.loading ? "Confirming…" : "Confirm qualified"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState(sampleLeads);
  const [activeLead, setActiveLead] = useState(null);

  function handleDone(lead, result) {
    setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, status: result.status, charge_amount_naira: result.chargeAmount } : l)));
  }

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle="Attribution and billing events for your campaigns - full contact details were sent to your email or CRM the moment each lead qualified, not stored here."
      />

      <Paper variant="outlined" sx={{ borderColor: tokens.border, borderRadius: 3, overflow: "hidden" }}>
        {leads.map((lead, i) => {
          const style = STATUS_STYLE[lead.status];
          return (
            <Box
              key={lead.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2.5,
                py: 2,
                borderTop: i === 0 ? "none" : `1px solid ${tokens.border}`,
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ minWidth: 200 }}>
                <Typography fontWeight={700}>{lead.whatsapp_ref}</Typography>
                <Typography variant="caption" sx={{ color: tokens.muted }}>
                  {lead.product} · {lead.created_at}
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center">
                {lead.charge_amount_naira && (
                  <Typography variant="body2" fontWeight={700}>
                    ₦{lead.charge_amount_naira.toLocaleString()}
                  </Typography>
                )}
                <Chip size="small" label={style.label} sx={{ bgcolor: style.bg, color: style.fg, fontWeight: 700 }} />
                {lead.status === "captured" && (
                  <Button size="small" variant="contained" onClick={() => setActiveLead(lead)}>
                    Qualify manually
                  </Button>
                )}
              </Stack>
            </Box>
          );
        })}
        {leads.length === 0 && (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography sx={{ color: tokens.muted }}>No leads yet - share your campaign&apos;s referral links to start collecting them.</Typography>
          </Box>
        )}
      </Paper>

      <QualifyDialog
        lead={activeLead}
        open={!!activeLead}
        onClose={() => setActiveLead(null)}
        onDone={(result) => handleDone(activeLead, result)}
      />
    </>
  );
}
