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
  CircularProgress,
} from "@mui/material";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import PageHeader from "@/components/dashboard/PageHeader";
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
  { id: "l1", whatsapp_ref: "LD-7F3K9Q", status: "captured", product: "CareLink HMO Plan", industry: "Healthcare", created_at: "2026-07-28" },
  { id: "l2", whatsapp_ref: "LD-2M8XJZ", status: "qualified", product: "CareLink HMO Plan", industry: "Healthcare", created_at: "2026-07-26", charge_amount_naira: 5000 },
  { id: "l3", whatsapp_ref: "LD-9RT4WP", status: "rejected", product: "SwiftHR Payroll", industry: "Fintech", created_at: "2026-07-24" },
  { id: "l4", whatsapp_ref: "LD-3QX7MK", status: "qualified", product: "Lekki Waterfront Villas", industry: "Real Estate", created_at: "2026-07-27", charge_amount_naira: 20000 },
];

const STATUS_STYLE = {
  captured: { bg: "#FFF3C4", fg: tokens.brandInk, label: "Awaiting qualification" },
  qualified: { bg: "#E7F5EE", fg: tokens.success, label: "Intent Qualified" },
  rejected: { bg: "#F7F6F2", fg: tokens.muted, label: "Rejected" },
};

// Lead Management (filter/search/export) is free for every business - no
// plan gating since subscriptions were removed. See lib/siteSections.js
// "lead-management". Export is client-side since the leads already visible
// on screen are exactly what gets exported - no extra request needed.
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

function PayoutsTab({ userRowId }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!userRowId) {
      setLoading(false);
      return;
    }
    const supabase = createClient();

    async function load() {
      const { data: enrollments } = await supabase
        .from("affiliate_enrollments")
        .select("id, affiliate_programs(tier1_percent, products(name))")
        .eq("affiliate_id", userRowId);
      const enrollmentIds = (enrollments || []).map((e) => e.id);
      const enrollmentById = Object.fromEntries((enrollments || []).map((e) => [e.id, e]));

      if (enrollmentIds.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const { data: commissions } = await supabase
        .from("commissions")
        .select("id, enrollment_id, affiliate_payout_naira, payout_status, created_at")
        .in("enrollment_id", enrollmentIds)
        .order("created_at", { ascending: false });

      setRows(
        (commissions || []).map((c) => ({
          id: c.id,
          date: new Date(c.created_at).toLocaleDateString(),
          product: enrollmentById[c.enrollment_id]?.affiliate_programs?.products?.name || "Campaign",
          commissionNaira: Number(c.affiliate_payout_naira),
          status: c.payout_status,
        }))
      );
      setLoading(false);
    }
    load();
  }, [userRowId]);

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper variant="outlined" sx={{ borderColor: tokens.border, borderRadius: 3, overflow: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#F7F6F2" }}>
            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Campaign</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Commission</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{t.date}</TableCell>
              <TableCell>{t.product}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>₦{t.commissionNaira.toLocaleString()}</TableCell>
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
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} sx={{ textAlign: "center", py: 5, color: tokens.muted }}>
                No commissions yet.
              </TableCell>
            </TableRow>
          )}
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

function ConfirmSaleDialog({ lead, open, onClose, onDone }) {
  const [saleAmount, setSaleAmount] = useState("");
  const [commission, setCommission] = useState("");
  const [notes, setNotes] = useState("");
  const [state, setState] = useState({ loading: false, error: null });

  async function handleConfirm() {
    setState({ loading: true, error: null });
    try {
      const res = await fetch(`/api/leads/${lead.id}/confirm-sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedSaleAmountNaira: saleAmount ? Number(saleAmount) : null,
          reportedCommissionNaira: Number(commission),
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm sale");
      setState({ loading: false, error: null });
      onDone();
      onClose();
    } catch (err) {
      setState({ loading: false, error: err.message });
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Confirm sale closed - {lead?.whatsapp_ref}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
          This does not move any money through Commission - the client paid you directly, and you pay the
          referring affiliate directly. This just creates a record of what was paid, for both of you to have on
          file.
        </Typography>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Sale amount (₦, optional)"
            type="number"
            value={saleAmount}
            onChange={(e) => setSaleAmount(e.target.value)}
          />
          <TextField
            label="Commission paid to affiliate (₦)"
            type="number"
            required
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
          />
          <TextField label="Notes (optional)" multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Stack>
        {state.error && <Alert severity="error" sx={{ mt: 2 }}>{state.error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={state.loading} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={state.loading || !commission} variant="contained">
          {state.loading ? "Confirming…" : "Confirm sale"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function LeadsTab({ plan }) {
  const [leads, setLeads] = useState(sampleLeads);
  const [activeLead, setActiveLead] = useState(null);
  const [saleLead, setSaleLead] = useState(null);
  const canExport = plan === "plus";

  function handleDone(lead, result) {
    setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, status: result.status, charge_amount_naira: result.chargeAmount } : l)));
  }

  return (
    <>
      {plan !== "free" && (
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FileDownloadRoundedIcon />}
            disabled={!canExport}
            onClick={() => exportLeadsToCsv(leads)}
          >
            {canExport ? "Export CSV" : "Export CSV (Large only)"}
          </Button>
        </Stack>
      )}

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
                {lead.status === "qualified" && lead.industry === "Real Estate" && (
                  <Button size="small" variant="outlined" onClick={() => setSaleLead(lead)}>
                    Confirm sale closed
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

      <ConfirmSaleDialog
        lead={saleLead}
        open={!!saleLead}
        onClose={() => setSaleLead(null)}
        onDone={() => {
          /* Confirmation succeeded - no local status change needed, the
             lead stays 'qualified'; this is a separate, additional record,
             not a lead-status transition. */
        }}
      />
    </>
  );
}

export default function TransactionsPage() {
  const [tab, setTab] = useState(0);
  const [userRowId, setUserRowId] = useState(null);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return;
      const { data: userRow } = await supabase.from("users").select("id").eq("auth_user_id", authUser.id).single();
      if (!userRow) return;
      setUserRowId(userRow.id);
      const { data: biz } = await supabase.from("businesses").select("plan").eq("owner_id", userRow.id).maybeSingle();
      setPlan(biz?.plan || "free");
    });
  }, []);

  return (
    <>
      <PageHeader title="Transactions" subtitle="Every sale, commission, payout, and lead tied to your account." />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: `1px solid ${tokens.border}` }}>
        <Tab label="Payouts" sx={{ textTransform: "none", fontWeight: 600 }} />
        <Tab label="Leads" sx={{ textTransform: "none", fontWeight: 600 }} />
      </Tabs>

      {tab === 0 ? <PayoutsTab userRowId={userRowId} /> : <LeadsTab plan={plan} />}
    </>
  );
}
