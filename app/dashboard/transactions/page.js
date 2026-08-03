"use client";

import { useState, useEffect } from "react";
import {
  Paper,
  Box,
  Typography,
  Chip,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import PageHeader from "@/components/dashboard/PageHeader";
import { sampleTransactions } from "@/lib/sampleData";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";

// Production queries:
//   Payouts tab: supabase.from("commissions").select("*, transactions(*), affiliate_enrollments(*)")
//     .in("enrollment_id", myEnrollmentIds).order("created_at", { ascending: false })
//   Leads tab: supabase.from("leads").select("*, affiliate_programs(*, products(name, businesses(id, owner_id)))")
//     .in("affiliate_programs.products.business_id", myBusinessIds).order("created_at", { ascending: false })
//     Note there is no name/phone/email field to select - Commission never stores a lead's
//     identity (see supabase/schema.sql). Full details were already forwarded to this
//     business's own email or webhook the moment the lead qualified (see lib/leadForwarding.js).

const sampleLeads = [
  { id: "l1", whatsapp_ref: "LD-7F3K9Q", status: "captured", product: "CareLink HMO Plan", created_at: "2026-07-28" },
  { id: "l2", whatsapp_ref: "LD-2M8XJZ", status: "qualified", product: "CareLink HMO Plan", created_at: "2026-07-26", charge_amount_naira: 5000 },
  { id: "l3", whatsapp_ref: "LD-9RT4WP", status: "rejected", product: "SwiftHR Payroll", created_at: "2026-07-24" },
];

const STATUS_STYLE = {
  captured: { bg: "#FFF3C4", fg: tokens.brandInk, label: "Awaiting qualification" },
  qualified: { bg: "#E7F5EE", fg: tokens.success, label: "Intent Qualified" },
  rejected: { bg: "#F1EFE7", fg: tokens.muted, label: "Rejected" },
};

// Lead Management (filter/search/export) is a Medium/Large plan feature -
// see lib/siteSections.js "lead-management". Export is client-side since
// the leads already visible on screen are exactly what gets exported -
// no extra request needed.
function exportLeadsToCsv(leads) {
  const header = ["Reference", "Campaign", "Status", "Charge (NGN)", "Date"];
  const rows = leads.map((l) => [
    l.whatsapp_ref,
    l.product,
    STATUS_STYLE[l.status]?.label || l.status,
    l.charge_amount_naira || "",
    l.created_at,
  ]);
  const csv = [header, ...rows].map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `commission-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function PayoutsTab() {
  return (
    <Paper variant="outlined" sx={{ borderColor: tokens.border, borderRadius: 3, overflow: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#F1EFE7" }}>
            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Campaign</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Sale amount</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Tier</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Commission</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Platform fee</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sampleTransactions.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{t.date}</TableCell>
              <TableCell>{t.product}</TableCell>
              <TableCell sx={{ color: tokens.muted }}>{t.customer}</TableCell>
              <TableCell>₦{t.amountNaira.toLocaleString()}</TableCell>
              <TableCell>Tier {t.tier}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>₦{t.commissionNaira.toLocaleString()}</TableCell>
              <TableCell sx={{ color: tokens.muted }}>₦{t.feeNaira.toLocaleString()}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={t.status}
                  sx={{
                    textTransform: "capitalize",
                    bgcolor: t.status === "paid" ? "#E7F5EE" : "#FFF3C4",
                    color: t.status === "paid" ? tokens.success : tokens.brandInk,
                    fontWeight: 700,
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

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
          program&apos;s cost per Intent Qualified Lead and pays your affiliates automatically.
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

function LeadsTab({ plan }) {
  const [leads, setLeads] = useState(sampleLeads);
  const [activeLead, setActiveLead] = useState(null);
  const canExport = plan === "pro" || plan === "plus";

  function handleDone(lead, result) {
    setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, status: result.status, charge_amount_naira: result.chargeAmount } : l)));
  }

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<FileDownloadRoundedIcon />}
          disabled={!canExport}
          onClick={() => exportLeadsToCsv(leads)}
        >
          {canExport ? "Export CSV" : "Export CSV (Medium/Large)"}
        </Button>
      </Stack>

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

export default function TransactionsPage() {
  const [tab, setTab] = useState(0);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return;
      const { data: userRow } = await supabase.from("users").select("id").eq("auth_user_id", authUser.id).single();
      if (!userRow) return;
      const { data: biz } = await supabase.from("businesses").select("plan").eq("owner_id", userRow.id).maybeSingle();
      setPlan(biz?.plan || null);
    });
  }, []);

  return (
    <>
      <PageHeader title="Transactions" subtitle="Every sale, commission, payout, and lead tied to your account." />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: `1px solid ${tokens.border}` }}>
        <Tab label="Payouts" sx={{ textTransform: "none", fontWeight: 600 }} />
        <Tab label="Leads" sx={{ textTransform: "none", fontWeight: 600 }} />
      </Tabs>

      {tab === 0 ? <PayoutsTab /> : <LeadsTab plan={plan} />}
    </>
  );
}
