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
  Tabs,
  Tab,
  Chip,
} from "@mui/material";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";
import pricingPlans from "@/content/pricingPlans.json";

// Every tab's card spans the page's real content width (matching the tab
// bar above it) instead of being its own narrow island - the actual form
// fields are centered inside a narrower inner column, which is different
// from shrinking the whole card down.
const INNER_WIDTH = 420;

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
    <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
      <Box sx={{ maxWidth: INNER_WIDTH, mx: "auto" }}>
        <Typography fontWeight={700} sx={{ mb: 0.5, textAlign: "center" }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: tokens.muted, mb: 3, textAlign: "center" }}>
          {description}
        </Typography>

        {state.success && <Alert severity="success" sx={{ mb: 2 }}>Verified: {state.success}</Alert>}
        {state.error && <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {extraFields?.map((f) => (
              <TextField
                key={f.name}
                label={f.label}
                fullWidth
                required
                value={extra[f.name] || ""}
                onChange={(e) => setExtra((x) => ({ ...x, [f.name]: e.target.value }))}
              />
            ))}
            <TextField select label="Bank" fullWidth required value={bankCode} onChange={(e) => setBankCode(e.target.value)}>
              {banks.map((b) => (
                <MenuItem key={b.code} value={b.code}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Account number"
              fullWidth
              required
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </Stack>
          <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
            <Button type="submit" variant="contained" disabled={state.loading || !bankCode || !accountNumber}>
              {state.loading ? <CircularProgress size={20} /> : submitLabel}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}

function WalletTab({ businessId, balanceNaira }) {
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
    <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: tokens.border }}>
      <Box sx={{ maxWidth: INNER_WIDTH, mx: "auto", textAlign: "center" }}>
        <Typography fontWeight={700} sx={{ mb: 0.5 }}>
          Campaign wallet
        </Typography>
        <Typography variant="body2" sx={{ color: tokens.muted, mb: 3 }}>
          Commission deducts from this balance automatically whenever a lead is qualified or a sale is verified — top
          it up anytime via Paystack.
        </Typography>

        <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "#F7F6F2", mb: 3 }}>
          <Typography variant="caption" sx={{ color: tokens.muted }}>
            Current balance
          </Typography>
          <Typography variant="h4" sx={{ fontSize: 30 }}>
            ₦{balanceNaira.toLocaleString()}
          </Typography>
        </Box>

        {state.error && <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert>}

        <Box component="form" onSubmit={handleTopup}>
          <Stack spacing={2} alignItems="center">
            <TextField
              label="Amount to add (₦)"
              type="number"
              fullWidth
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button type="submit" variant="contained" disabled={state.loading}>
              {state.loading ? <CircularProgress size={20} /> : "Add funds"}
            </Button>
            <Typography variant="caption" sx={{ color: tokens.muted }}>
              Minimum ₦250,000
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}

function SubscriptionsTab({ currentPlanId }) {
  return (
    <Box>
      <Typography fontWeight={700} sx={{ mb: 0.5, textAlign: "center" }}>
        Your plan
      </Typography>
      <Typography variant="body2" sx={{ color: tokens.muted, mb: 3, textAlign: "center" }}>
        Your platform fee and campaign limits are based on this plan.
      </Typography>
      <Grid container spacing={3}>
        {pricingPlans.plans.map((plan) => {
          const isCurrent = plan.id === (currentPlanId || "free");
          return (
            <Grid item xs={12} sm={4} key={plan.id}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  height: "100%",
                  textAlign: "center",
                  borderColor: isCurrent ? tokens.brand : tokens.border,
                  borderWidth: isCurrent ? 2 : 1,
                  position: "relative",
                }}
              >
                {isCurrent && (
                  <Chip
                    label="Current plan"
                    size="small"
                    sx={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700 }}
                  />
                )}
                <Typography variant="h6" fontWeight={800} sx={{ mt: 1 }}>
                  {plan.name}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ my: 1 }}>
                  {plan.priceNaira === 0 ? "₦0" : `₦${plan.priceNaira.toLocaleString()}`}
                  <Typography component="span" variant="body2" sx={{ color: tokens.muted }}>
                    {plan.priceSuffix}
                  </Typography>
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
                  {plan.feePercent}% platform fee
                </Typography>
                <Stack spacing={0.75} sx={{ textAlign: "left" }}>
                  {plan.features.map((f) => (
                    <Typography key={f} variant="caption" sx={{ color: tokens.muted }}>
                      • {f}
                    </Typography>
                  ))}
                </Stack>
                {!isCurrent && (
                  <Button variant="outlined" size="small" sx={{ mt: 2 }} disabled>
                    {plan.cta}
                  </Button>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
      <Typography variant="caption" sx={{ color: tokens.muted, display: "block", textAlign: "center", mt: 2 }}>
        Self-service plan switching isn't available yet — reach out to change plans for now.
      </Typography>
    </Box>
  );
}

const TABS = ["Account", "Wallet", "Subscriptions", "Business", "Bank"];

export default function AccountPage() {
  const [tab, setTab] = useState(0);
  const [user, setUser] = useState(null);
  const [userRow, setUserRow] = useState(null);
  const [business, setBusiness] = useState(null);
  const [form, setForm] = useState({ fullName: "", phone: "", businessName: "", industry: "", website: "" });
  const [saveState, setSaveState] = useState({ loading: false, error: null, success: false });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      setUser(authUser);
      if (!authUser) return;
      const { data: uRow } = await supabase
        .from("users")
        .select("id, phone, full_name")
        .eq("auth_user_id", authUser.id)
        .single();
      if (!uRow) return;
      setUserRow(uRow);

      const { data: biz } = await supabase
        .from("businesses")
        .select("id, plan, name, industry, website, wallet_balance_naira")
        .eq("owner_id", uRow.id)
        .maybeSingle();
      setBusiness(biz || null);

      // fullName is a real controlled field - it used to be an uncontrolled
      // defaultValue, which is exactly why the floating label could end up
      // overlapping the typed text.
      setForm({
        fullName: uRow.full_name || authUser.user_metadata?.full_name || "",
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
        const { error: userError } = await supabase
          .from("users")
          .update({ full_name: form.fullName, phone: form.phone })
          .eq("id", userRow.id);
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

  return (
    <>
      <PageHeader title="Account" subtitle="Profile, business information, payment details, and settings." />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 3, borderBottom: `1px solid ${tokens.border}` }}>
        {TABS.map((t) => (
          <Tab key={t} label={t} sx={{ textTransform: "none", fontWeight: 600 }} />
        ))}
      </Tabs>

      {tab === 0 && (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: tokens.border }}>
          <Box sx={{ maxWidth: INNER_WIDTH, mx: "auto" }}>
            <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <Avatar src={user?.user_metadata?.avatar_url} sx={{ width: 72, height: 72, bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700, fontSize: 28 }}>
                {(form.fullName || user?.email || "?").charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ textAlign: "center" }}>
                <Typography fontWeight={700}>Signed in with Google</Typography>
                <Typography variant="body2" sx={{ color: tokens.muted }}>
                  {user?.email || "…"}
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ mb: 3 }} />
            <Stack spacing={2}>
              <TextField
                label="Full name"
                fullWidth
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
              <TextField
                label="Phone number"
                fullWidth
                placeholder="08012345678"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/[^0-9]/g, "").slice(0, 11) }))}
                helperText={form.phone && form.phone.length !== 11 ? `${form.phone.length}/11 digits` : "11 digits, no +234 needed"}
                error={form.phone.length > 0 && form.phone.length !== 11}
              />
            </Stack>
          </Box>
        </Paper>
      )}

      {tab === 1 && <WalletTab businessId={business?.id} balanceNaira={business?.wallet_balance_naira || 0} />}

      {tab === 2 && <SubscriptionsTab currentPlanId={business?.plan} />}

      {tab === 3 && (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: tokens.border }}>
          <Box sx={{ maxWidth: INNER_WIDTH, mx: "auto" }}>
            <Typography fontWeight={700} sx={{ mb: 1, textAlign: "center" }}>
              Business profile
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.muted, mb: 3, textAlign: "center" }}>
              Required before you can create a campaign. Every Commission account can act as a business, an
              affiliate, or both.
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Business name"
                fullWidth
                required
                value={form.businessName}
                onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
              />
              <TextField
                label="Industry"
                fullWidth
                required
                value={form.industry}
                onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
              />
              <TextField
                label="Website"
                fullWidth
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                helperText="Optional"
              />
            </Stack>
          </Box>
        </Paper>
      )}

      {tab === 4 && (
        <>
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
              business's own proceeds here automatically at checkout, split
              from the affiliate commission in the same transaction. Not used
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
        </>
      )}

      <Box sx={{ maxWidth: INNER_WIDTH, mx: "auto", mt: 3 }}>
        {saveState.error && <Alert severity="error" sx={{ mb: 2 }}>{saveState.error}</Alert>}
        {saveState.success && <Alert severity="success" sx={{ mb: 2 }}>Saved</Alert>}
      </Box>

      <Stack direction="row" justifyContent="center" sx={{ mt: 1 }}>
        <Button variant="contained" size="large" onClick={handleSave} disabled={saveState.loading}>
          {saveState.loading ? <CircularProgress size={20} /> : "Save changes"}
        </Button>
      </Stack>
    </>
  );
}