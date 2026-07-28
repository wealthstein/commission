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

export default function AccountPage() {
  return (
    <>
      <PageHeader title="Account" subtitle="Profile, business information, payment details, and settings." />

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700 }}>U</Avatar>
          <Box>
            <Typography fontWeight={700}>Signed in with Google</Typography>
            <Typography variant="body2" sx={{ color: tokens.muted }}>
              you@example.com
            </Typography>
          </Box>
        </Stack>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Full name" fullWidth defaultValue="" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Phone number" fullWidth defaultValue="" />
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
        <Typography fontWeight={700} sx={{ mb: 2 }}>
          Business profile
        </Typography>
        <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
          Only needed if you're listing products. Every Commission account can act as a business, an affiliate, or both.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Business name" fullWidth defaultValue="" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Industry" fullWidth defaultValue="" />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Website" fullWidth defaultValue="" />
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

      <BankConnectForm
        title="Business settlement account"
        description="Where Paystack sends your product-sale proceeds directly, minus any affiliate commissions."
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

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" size="large">
          Save changes
        </Button>
      </Stack>
    </>
  );
}
