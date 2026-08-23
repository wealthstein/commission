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
  TextField,
  Tooltip,
} from "@mui/material";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";

// Payouts tab: real query, see PayoutsTab below.
// Leads tab: real query, see LeadsTab below - uses a multi-step lookup
// (business -> products -> programs -> leads) rather than a single
// embedded-filter query, matching the same proven pattern PayoutsTab
// already uses successfully, since nested-relation filtering with .in()
// across multiple levels has caused real bugs elsewhere in this app.
//   Note there is no name/phone/email field selected - Commission never
//   stores a lead's identity (see supabase/schema.sql). Full details were
//   already forwarded to this business's own email or webhook the moment
//   the lead qualified (see lib/leadForwarding.js).

const STATUS_STYLE = {
  captured: { bg: "#FFF3C4", fg: tokens.brandInk, label: "Awaiting qualification" },
  qualified: { bg: "#E7F5EE", fg: tokens.success, label: "Intent Qualified" },
  rejected: { bg: "#F7F6F2", fg: tokens.muted, label: "Rejected" },
};

// Purely informational (see lib/riskSignals.js) - not wired into Radar's
// trust scoring, doesn't block or auto-reject anything. A business can
// use "Mark as invalid" below on a flagged lead using their own judgment.
const RISK_FLAG_LABELS = {
  fast_fill: "Filled in under 3 seconds",
  low_time_on_page: "Submitted almost instantly after landing",
  cross_campaign_phone_match: "Same phone seen on other campaigns recently",
  cross_campaign_ip_match: "Same network seen on other campaigns recently",
};

// Lead Management (filter/search/export) is free for every business - no
// plan gating since subscriptions were removed. See lib/siteSections.js
// "lead-management". Export is client-side since the leads already visible
// on screen are exactly what gets exported - no extra request needed.
function exportLeadsToCsv(leads) {
  const header = ["Reference", "Campaign", "Status", "Charge (NGN)", "Date"];
  const rows = leads.map((l) => [
    l.lead_ref,
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
      <DialogTitle>Confirm sale closed - {lead?.lead_ref}</DialogTitle>
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

function RejectLeadDialog({ lead, open, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [state, setState] = useState({ loading: false, error: null });

  async function handleReject() {
    setState({ loading: true, error: null });
    try {
      const res = await fetch(`/api/leads/${lead.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject lead");
      setState({ loading: false, error: null });
      onDone();
      onClose();
    } catch (err) {
      setState({ loading: false, error: err.message });
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Mark as invalid - {lead?.lead_ref}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
          This removes the lead from your active pipeline. It doesn&apos;t affect the referring affiliate&apos;s
          trust status - that&apos;s calculated separately from your own bookkeeping.
        </Typography>
        <TextField
          label="Reason"
          placeholder="Wrong number, spam, duplicate, etc."
          fullWidth
          required
          multiline
          minRows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {state.error && <Alert severity="error" sx={{ mt: 2 }}>{state.error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={state.loading} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleReject} disabled={state.loading || !reason.trim()} variant="contained" color="error">
          {state.loading ? "Marking…" : "Mark as invalid"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function LeadsTab({ plan, userRowId }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saleLead, setSaleLead] = useState(null);
  const [rejectLead, setRejectLead] = useState(null);
  const canExport = plan === "plus";

  useEffect(() => {
    if (!userRowId) {
      setLoading(false);
      return;
    }
    const supabase = createClient();

    async function load() {
      const { data: business } = await supabase.from("businesses").select("id").eq("owner_id", userRowId).maybeSingle();
      if (!business) {
        setLeads([]);
        setLoading(false);
        return;
      }

      const { data: products } = await supabase.from("products").select("id, name, category").eq("business_id", business.id);
      const productIds = (products || []).map((p) => p.id);
      const productById = Object.fromEntries((products || []).map((p) => [p.id, p]));
      if (productIds.length === 0) {
        setLeads([]);
        setLoading(false);
        return;
      }

      const { data: programs } = await supabase.from("affiliate_programs").select("id, product_id").in("product_id", productIds);
      const programIds = (programs || []).map((p) => p.id);
      const productIdByProgram = Object.fromEntries((programs || []).map((p) => [p.id, p.product_id]));
      if (programIds.length === 0) {
        setLeads([]);
        setLoading(false);
        return;
      }

      // Note there is no name/phone/email field to select - Commission
      // never stores a lead's identity (see supabase/schema.sql). Full
      // details were already forwarded to this business's own email or
      // webhook the moment the lead qualified (see lib/leadForwarding.js).
      const { data: leadRows } = await supabase
        .from("leads")
        .select("id, lead_ref, status, program_id, charge_amount_naira, created_at, risk_flags")
        .in("program_id", programIds)
        .order("created_at", { ascending: false });

      setLeads(
        (leadRows || []).map((l) => {
          const product = productById[productIdByProgram[l.program_id]];
          return {
            id: l.id,
            lead_ref: l.lead_ref,
            status: l.status,
            product: product?.name || "Campaign",
            industry: product?.category || null,
            charge_amount_naira: l.charge_amount_naira ? Number(l.charge_amount_naira) : null,
            risk_flags: l.risk_flags || [],
            created_at: new Date(l.created_at).toLocaleDateString(),
          };
        })
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
                <Typography fontWeight={700}>{lead.lead_ref}</Typography>
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
                {lead.risk_flags?.length > 0 && (
                  <Tooltip
                    title={
                      <>
                        {lead.risk_flags.map((flag) => (
                          <div key={flag}>{RISK_FLAG_LABELS[flag] || flag}</div>
                        ))}
                      </>
                    }
                  >
                    <WarningAmberRoundedIcon sx={{ fontSize: 18, color: "#B87503" }} />
                  </Tooltip>
                )}
                {lead.status === "qualified" && lead.industry === "Real Estate" && (
                  <Button size="small" variant="outlined" onClick={() => setSaleLead(lead)}>
                    Confirm sale closed
                  </Button>
                )}
                {lead.status === "captured" && (
                  <Button size="small" variant="outlined" color="error" onClick={() => setRejectLead(lead)}>
                    Mark as invalid
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

      <RejectLeadDialog
        lead={rejectLead}
        open={!!rejectLead}
        onClose={() => setRejectLead(null)}
        onDone={() => {
          setLeads((prev) => prev.map((l) => (l.id === rejectLead.id ? { ...l, status: "rejected" } : l)));
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

      {tab === 0 ? <PayoutsTab userRowId={userRowId} /> : <LeadsTab plan={plan} userRowId={userRowId} />}
    </>
  );
}