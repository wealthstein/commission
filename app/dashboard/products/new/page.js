"use client";

import { useState } from "react";
import {
  Paper,
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Alert,
} from "@mui/material";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";

const CATEGORIES = ["HMO", "HR Software", "SaaS", "Insurance", "Internet Service Provider", "Other"];
const BILLING = [
  { value: "one_time", label: "One-time" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

export default function NewProductPage() {
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    billing_frequency: "one_time",
    product_url: "",
    commission_type: "one_time",
    tier1: 8,
    tier2: 5,
    tier3: 2,
  });
  const [status, setStatus] = useState({ loading: false, error: null, success: false });

  const totalCommission = Number(form.tier1 || 0) + Number(form.tier2 || 0) + Number(form.tier3 || 0);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    if (totalCommission > 100) {
      setStatus({ loading: false, error: "Total affiliate commission across all tiers can't exceed 100%.", success: false });
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus({ loading: false, error: "Please sign in first.", success: false });
        return;
      }

      // 1. Ensure the caller has a business profile (created on first product listing).
      const { data: businesses } = await supabase.from("businesses").select("id").limit(1);
      let businessId = businesses?.[0]?.id;

      if (!businessId) {
        const { data: userRow } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single();
        const { data: newBusiness, error: bizError } = await supabase
          .from("businesses")
          .insert({ owner_id: userRow.id, name: `${user.email}'s business`, slug: `biz-${Date.now()}` })
          .select()
          .single();
        if (bizError) throw bizError;
        businessId = newBusiness.id;
      }

      // 2. Create the product.
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          business_id: businessId,
          name: form.name,
          slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: form.description,
          category: form.category,
          price_naira: Number(form.price),
          billing_frequency: form.billing_frequency,
          product_url: form.product_url,
          status: "active",
        })
        .select()
        .single();
      if (productError) throw productError;

      // 3. Launch the affiliate program.
      const { error: programError } = await supabase.from("affiliate_programs").insert({
        product_id: product.id,
        commission_type: form.commission_type,
        tier1_percent: Number(form.tier1),
        tier2_percent: Number(form.tier2),
        tier3_percent: Number(form.tier3),
        status: "active",
      });
      if (programError) throw programError;

      setStatus({ loading: false, error: null, success: true });
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: false });
    }
  }

  return (
    <>
      <PageHeader title="New product" subtitle="List a product and launch its affiliate program in one step." />

      {status.success && <Alert severity="success" sx={{ mb: 3 }}>Product listed and affiliate program launched.</Alert>}
      {status.error && <Alert severity="error" sx={{ mb: 3 }}>{status.error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            Product details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField label="Product name" fullWidth required value={form.name} onChange={(e) => update("name", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select label="Category" fullWidth required value={form.category} onChange={(e) => update("category", e.target.value)}>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={2}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Price (₦)"
                type="number"
                fullWidth
                required
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Billing frequency"
                fullWidth
                value={form.billing_frequency}
                onChange={(e) => update("billing_frequency", e.target.value)}
              >
                {BILLING.map((b) => (
                  <MenuItem key={b.value} value={b.value}>
                    {b.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Purchase URL"
                fullWidth
                required
                placeholder="https://yourproduct.com/checkout"
                value={form.product_url}
                onChange={(e) => update("product_url", e.target.value)}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border }}>
          <Typography fontWeight={700} sx={{ mb: 0.5 }}>
            Affiliate program
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
            Up to 3 tiers. Commission's platform fee is taken from this commission, never from your sale price.
          </Typography>

          <ToggleButtonGroup
            value={form.commission_type}
            exclusive
            onChange={(_, v) => v && update("commission_type", v)}
            sx={{ mb: 3 }}
          >
            <ToggleButton value="one_time">One-time commission</ToggleButton>
            <ToggleButton value="recurring">Recurring commission</ToggleButton>
          </ToggleButtonGroup>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Tier 1 (%)"
                type="number"
                fullWidth
                value={form.tier1}
                onChange={(e) => update("tier1", e.target.value)}
                helperText="Direct affiliate — required"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Tier 2 (%)"
                type="number"
                fullWidth
                value={form.tier2}
                onChange={(e) => update("tier2", e.target.value)}
                helperText="Who referred tier 1 — optional"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Tier 3 (%)"
                type="number"
                fullWidth
                value={form.tier3}
                onChange={(e) => update("tier3", e.target.value)}
                helperText="Who referred tier 2 — optional"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" sx={{ color: tokens.muted }}>
              Total commission across tiers
            </Typography>
            <Typography fontWeight={700} color={totalCommission > 100 ? "error" : "inherit"}>
              {totalCommission}%
            </Typography>
          </Stack>
        </Paper>

        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button type="submit" variant="contained" size="large" disabled={status.loading}>
            {status.loading ? "Publishing…" : "Publish product & program"}
          </Button>
        </Stack>
      </Box>
    </>
  );
}
