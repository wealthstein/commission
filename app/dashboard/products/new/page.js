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
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LaptopMacRoundedIcon from "@mui/icons-material/LaptopMacRounded";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";
import { categoriesForType } from "@/lib/categories";

const BILLING = [
  { value: "one_time", label: "One-time" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

const DEFAULTS = {
  product_type: "digital",
  name: "",
  category: "",
  description: "",
  price: "",
  billing_frequency: "one_time",
  product_url: "",
  offline_payment_instructions: "",
  commission_type: "one_time",
  tier1: 8,
  tier2: 5,
  tier3: 2,
};

export default function NewProductPage() {
  const [form, setForm] = useState(DEFAULTS);
  const [status, setStatus] = useState({ loading: false, error: null, success: false });

  const isPhysical = form.product_type === "physical";
  const totalCommission = Number(form.tier1 || 0) + Number(form.tier2 || 0) + Number(form.tier3 || 0);
  const categoryOptions = categoriesForType(form.product_type);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function selectProductType(type) {
    // Switching type resets fields that don't apply to the new type, so a
    // half-filled physical-only field can't silently leak into a digital
    // product (or vice versa).
    setForm({
      ...DEFAULTS,
      product_type: type,
      name: form.name,
      description: form.description,
      price: form.price,
      product_url: form.product_url,
    });
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

      // 2. Create the product. Physical/digital-specific fields are only
      // sent when relevant — see the Product Type toggle above.
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          business_id: businessId,
          name: form.name,
          slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: form.description,
          category: form.category,
          product_type: form.product_type,
          price_naira: Number(form.price),
          billing_frequency: isPhysical ? "one_time" : form.billing_frequency,
          product_url: form.product_url,
          offline_payment_instructions: isPhysical ? form.offline_payment_instructions : null,
          status: "active",
        })
        .select()
        .single();
      if (productError) throw productError;

      // 3. Launch the affiliate program. Physical products only ever use
      // one-time commission (no recurring billing exists for a one-off sale).
      const { error: programError } = await supabase.from("affiliate_programs").insert({
        product_id: product.id,
        commission_type: isPhysical ? "one_time" : form.commission_type,
        tier1_percent: Number(form.tier1),
        tier2_percent: Number(form.tier2),
        tier3_percent: Number(form.tier3),
        status: "active",
      });
      if (programError) throw programError;

      setStatus({ loading: false, error: null, success: true });

      // In production, move this insert into a server Route Handler instead
      // of doing it client-side, and have that route call revalidatePath()
      // directly (see app/api/revalidate/route.js) right after the insert.
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
          <Typography fontWeight={700} sx={{ mb: 0.5 }}>
            Product type
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
            This determines how customers pay and how Commission makes money from this product.
          </Typography>

          <ToggleButtonGroup
            value={form.product_type}
            exclusive
            onChange={(_, v) => v && selectProductType(v)}
            sx={{ width: "100%", gap: 2, "& .MuiToggleButtonGroup-grouped": { border: `1px solid ${tokens.border} !important`, borderRadius: "12px !important" } }}
          >
            <ToggleButton
              value="physical"
              sx={{
                flex: 1,
                flexDirection: "column",
                alignItems: "flex-start",
                textTransform: "none",
                p: 2.5,
                gap: 0.5,
                "&.Mui-selected": { bgcolor: tokens.brand, "&:hover": { bgcolor: tokens.brand } },
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Inventory2RoundedIcon fontSize="small" />
                <Typography fontWeight={700}>Physical Product</Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: form.product_type === "physical" ? tokens.brandInk : tokens.muted, textAlign: "left" }}>
                Electronics, furniture, cars, real estate, fashion, beauty, appliances. Customer pays you directly — subscription-only revenue for Commission.
              </Typography>
            </ToggleButton>
            <ToggleButton
              value="digital"
              sx={{
                flex: 1,
                flexDirection: "column",
                alignItems: "flex-start",
                textTransform: "none",
                p: 2.5,
                gap: 0.5,
                "&.Mui-selected": { bgcolor: tokens.brand, "&:hover": { bgcolor: tokens.brand } },
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <LaptopMacRoundedIcon fontSize="small" />
                <Typography fontWeight={700}>Digital Product</Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: form.product_type === "digital" ? tokens.brandInk : tokens.muted, textAlign: "left" }}>
                SaaS, HR software, HMO, insurance, internet, courses, memberships. Paid via Paystack through Commission — automatic split + payouts.
              </Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>

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
                {categoryOptions.map((c) => (
                  <MenuItem key={c.slug} value={c.label}>
                    {c.label}
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
            <Grid item xs={12} sm={isPhysical ? 6 : 4}>
              <TextField
                label="Price (₦)"
                type="number"
                fullWidth
                required
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
            </Grid>

            {/* DIGITAL ONLY: billing frequency (physical sales are always one-time) */}
            {!isPhysical && (
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
            )}

            <Grid item xs={12} sm={isPhysical ? 6 : 4}>
              <TextField
                label={isPhysical ? "Where customers buy (your site, WhatsApp, store)" : "Purchase URL"}
                fullWidth
                required
                placeholder={isPhysical ? "https://wa.me/234..." : "https://yourproduct.com/checkout"}
                value={form.product_url}
                onChange={(e) => update("product_url", e.target.value)}
              />
            </Grid>

            {/* PHYSICAL ONLY: offline payment info + sales verification note */}
            {isPhysical && (
              <Grid item xs={12}>
                <TextField
                  label="Payment & sales verification instructions"
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="e.g. Bank transfer to Zenith Bank 0123456789. We'll ask for a receipt or order reference when confirming affiliate sales."
                  value={form.offline_payment_instructions}
                  onChange={(e) => update("offline_payment_instructions", e.target.value)}
                  helperText="Shown on your product page, and used when you confirm a manually-reported sale."
                />
              </Grid>
            )}
          </Grid>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border }}>
          <Typography fontWeight={700} sx={{ mb: 0.5 }}>
            Affiliate program
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
            {isPhysical
              ? "Up to 3 tiers. Physical products never carry a Commission platform fee — your affiliates get the full commission you set."
              : "Up to 3 tiers. Commission's platform fee is taken from this commission (based on your plan), never from your sale price."}
          </Typography>

          {/* DIGITAL ONLY: one-time vs recurring commission (a one-off physical sale has nothing to recur) */}
          {!isPhysical && (
            <ToggleButtonGroup
              value={form.commission_type}
              exclusive
              onChange={(_, v) => v && update("commission_type", v)}
              sx={{ mb: 3 }}
            >
              <ToggleButton value="one_time">One-time commission</ToggleButton>
              <ToggleButton value="recurring">Recurring commission</ToggleButton>
            </ToggleButtonGroup>
          )}

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
