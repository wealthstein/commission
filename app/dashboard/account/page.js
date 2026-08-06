"use client";

import { useEffect, useState } from "react";
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Stack,
  Avatar,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";

function BankConnectForm({ title, description, onSubmit, extraFields, submitLabel }) {
  const [banks, setBanks] = useState([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [extra, setExtra] = useState({});
  const [state, setState] = useState({ loading: false, error: null, success: null });

  useEffect(() => {
    fetch("/api/paystack/banks")
      .then((r) => r.json())
      .then((d) => setBanks(d.banks || []))
      .catch(() => setBanks([]));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setState({ loading: true, error: null, success: null });
    try {
      const result = await onSubmit({ bankCode, accountNumber, ...extra });
      setState({ loading: false, error: null, success: result.accountName || "Connected" });
    } catch (err) {
      setState({ loading: false, error: err.message, success: null });
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
      <Typography fontWeight={700} sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
        {description}
      </Typography>

      {state.success && <Alert severity="success" sx={{ mb: 2 }}>Verified: {state.success}</Alert>}
      {state.error && <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {extraFields?.map((f) => (
            <Grid item xs={12} sm={6} key={f.name}>
              <TextField
                label={f.label}
                fullWidth
                required
                value={extra[f.name] || ""}
                onChange={(e) => setExtra((x) => ({ ...x, [f.name]: e.target.value }))}
              />
            </Grid>
          ))}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Bank"
              fullWidth
              required
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
            >
              {banks.map((b) => (
                <MenuItem key={b.code} value={b.code}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Account number"
              fullWidth
              required
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </Grid>
        </Grid>
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button type="submit" variant="contained" disabled={state.loading || !bankCode || !accountNumber}>
            {state.loading ? <CircularProgress size={20} /> : submitLabel}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}

function WalletCard({ businessId, balanceNaira }) {
  const [amount, setAmount] = useState("");
  const [state, setState] = useState({ loading: false, error: null });

  async function handleTopup(e) {
    e.preventDefault();
    setState({ loading: true, error: null });
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, amountNaira: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start top-up");
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setState({ loading: false, error: err.message });
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
      <Typography fontWeight={700} sx={{ mb: 0.5 }}>
        Campaign wallet
      </Typography>
      <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
        Commission deducts from this balance automatically whenever a lead is qualified or a sale is verified — top it up
        anytime via Paystack.
      </Typography>

      <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "#F7F6F2", mb: 2.5 }}>
        <Typography variant="caption" sx={{ color: tokens.muted }}>
          Current balance
        </Typography>
        <Typography variant="h4" sx={{ fontSize: 30 }}>
          ₦{balanceNaira.toLocaleString()}
        </Typography>
      </Box>

      {state.error && <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert>}

      <Box component="form" onSubmit={handleTopup}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            label="Amount to add (₦)"
            type="number"
            size="small"
            fullWidth
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            helperText="Minimum ₦250,000"
          />
          <Button type="submit" variant="contained" disabled={state.loading} sx={{ flexShrink: 0 }}>
            {state.loading ? <CircularProgress size={20} /> : "Add funds"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [userRow, setUserRow] = useState(null);
  const [business, setBusiness] = useState(null);
  const [form, setForm] = useState({ phone: "", businessName: "", industry: "", website: "" });
  const [saveState, setSaveState] = useState({ loading: false, error: null, success: false });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      setUser(authUser);
      if (!authUser) return;
      const { data: uRow } = await supabase
        .from("users")
        .select("id, phone")
        .eq("auth_user_id", authUser.id)
        .single();
      if (!uRow) return;
      setUserRow(uRow);

      // Explicitly scoped to this user's own business - unlike the earlier
      // .limit(1) in campaigns/new, which grabbed whichever business
      // happened to be first in the table.
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, plan, name, industry, website, wallet_balance_naira")
        .eq("owner_id", uRow.id)
        .maybeSingle();
      setBusiness(biz || null);

      setForm({
        phone: uRow.phone || "",
        businessName: biz?.name || "",
        industry: biz?.industry || "",
        website: biz?.website || "",
      });
    });
  }, []);

  async function handleSave() {
    setSaveState({ loading: true, error: null, success: false });
    try {
      const supabase = createClient();
      if (userRow) {
        const { error: userError } = await supabase.from("users").update({ phone: form.phone }).eq("id", userRow.id);
        if (userError) throw userError;
      }
      if (business) {
        const { error: bizError } = await supabase
          .from("businesses")
          .update({ name: form.businessName, industry: form.industry, website: form.website })
          .eq("id", business.id);
        if (bizError) throw bizError;
      }
      setSaveState({ loading: false, error: null, success: true });
    } catch (err) {
      setSaveState({ loading: false, error: err.message, success: false });
    }
  }

  const firstName = user?.user_metadata?.given_name || user?.user_metadata?.full_name?.split(" ")[0];

  return (
    <>
      <PageHeader title="Account" subtitle="Profile, business information, payment details, and settings." />

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Avatar src={user?.user_metadata?.avatar_url} sx={{ width: 56, height: 56, bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700 }}>
            {(firstName || user?.email || "?").charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography fontWeight={700}>Signed in with Google</Typography>
            <Typography variant="body2" sx={{ color: tokens.muted }}>
              {user?.email || "…"}
            </Typography>
          </Box>
        </Stack>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Full name" fullWidth defaultValue={user?.user_metadata?.full_name || ""} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Phone number" fullWidth value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
        <Typography fontWeight={700} sx={{ mb: 2 }}>
          Business profile
        </Typography>
        <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
          Only needed if you are running campaigns. Every Commission account can act as a business, an affiliate, or both.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Business name" fullWidth value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Industry" fullWidth value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Website" fullWidth value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
          </Grid>
        </Grid>
      </Paper>

      <BankConnectForm
        title="Affiliate payout bank account"
        description="Where Paystack sends your affiliate commission payouts."
        submitLabel="Connect bank account"
        onSubmit={async ({ bankCode, accountNumber }) => {
          const res = await fetch("/api/paystack/recipient", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bankCode, accountNumber }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to connect bank account");
          return data;
        }}
      />

      {/* Only needed for SALE-goal campaigns — Paystack routes the
          business's own proceeds here automatically at checkout, split from
          the affiliate commission in the same transaction. Not used at all
          for LEAD-goal campaigns, which use the Campaign Wallet instead. */}
      <BankConnectForm
        title="Business settlement account"
        description="Required for direct-sale campaigns — this is where your share of each sale lands automatically, the moment a customer pays."
        submitLabel="Connect settlement account"
        extraFields={[{ name: "businessId", label: "Business ID" }]}
        onSubmit={async ({ bankCode, accountNumber, businessId }) => {
          const res = await fetch("/api/paystack/subaccount", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bankCode, accountNumber, businessId }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to connect settlement account");
          return data;
        }}
      />

      <WalletCard businessId={business?.id} balanceNaira={business?.wallet_balance_naira || 0} />

      {saveState.error && <Alert severity="error" sx={{ mb: 2 }}>{saveState.error}</Alert>}
      {saveState.success && <Alert severity="success" sx={{ mb: 2 }}>Saved</Alert>}

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" size="large" onClick={handleSave} disabled={saveState.loading}>
          {saveState.loading ? <CircularProgress size={20} /> : "Save changes"}
        </Button>
      </Stack>
    </>
  );
}
