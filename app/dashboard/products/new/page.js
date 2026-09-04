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
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
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
  conversion_goal: "lead",
  name: "",
  category: "",
  description: "",
  price: "",
  billing_frequency: "one_time",
  product_url: "",
  offline_payment_instructions: "",
  whatsapp_number: "",
  cost_per_qualified_lead: "",
  commission_type: "one_time",
  tier1: 60,
  tier2: 25,
  tier3: 15,
};

export default function NewProductPage() {
  const [form, setForm] = useState(DEFAULTS);
  const [status, setStatus] = useState({ loading: false, error: null, success: false });

  const isPhysical = form.product_type === "physical";
  const isLead = form.conversion_goal === "lead";
  const totalCommission = Number(form.tier1 || 0) + Number(form.tier2 || 0) + Number(form.tier3 || 0);
  const categoryOptions = categoriesForType(form.product_type);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function selectConversionGoal(goal) {
    // Switching goal resets the fields that only make sense for one of them
    // — a lead campaign's tiers default to summing to 100 (the whole lead
    // fee gets allocated), a sale campaign's default to a realistic
    // percentage of the sale price.
    setForm((f) => ({
      ...f,
      conversion_goal: goal,
      tier1: goal === "lead" ? 60 : 8,
      tier2: goal === "lead" ? 25 : 5,
      tier3: goal === "lead" ? 15 : 2,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    if (totalCommission > 100) {
      setStatus({ loading: false, error: "Total affiliate commission across all tiers cannot exceed 100%.", success: false });
      return;
    }
    if (!isLead && totalCommission < 10) {
      setStatus({
        loading: false,
        error: "Direct-sale campaigns must commit at least 10% total commission across tiers.",
        success: false,
      });
      return;
    }
    if (isLead && !form.cost_per_qualified_lead) {
      setStatus({ loading: false, error: "Set a cost per qualified lead for a lead campaign.", success: false });
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
      const { data: businesses } = await supabase.from("core_businesses").select("id").limit(1);
      let businessId = businesses?.[0]?.id;

      if (!businessId) {
        const { data: userRow } = await supabase.from("core_users").select("id").eq("auth_user_id", user.id).single();
        const { data: newBusiness, error: bizError } = await supabase
          .from("core_businesses")
          .insert({ owner_id: userRow.id, name: `${user.email}'s business`, slug: `biz-${Date.now()}` })
          .select()
          .single();
        if (bizError) throw bizError;
        businessId = newBusiness.id;
      }

      // 2. Create the product. Customers always pay you directly (product_url,
      // offline_payment_instructions) regardless of physical vs digital —
      // that toggle now only affects which categories are available.
      const { data: product, error: productError } = await supabase
        .from("affiliate_campaigns")
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
          offline_payment_instructions: form.offline_payment_instructions || null,
          status: "active",
        })
        .select()
        .single();
      if (productError) throw productError;

      // 3. Launch the campaign. A lead campaign has no "commission_type" —
      // there is nothing to recur, only sale-goal campaigns can be recurring.
      const { error: programError } = await supabase.from("affiliate_programs").insert({
        product_id: product.id,
        conversion_goal: form.conversion_goal,
        commission_type: isLead ? "one_time" : form.commission_type,
        cost_per_qualified_lead_naira: isLead ? Number(form.cost_per_qualified_lead) : null,
        whatsapp_number: isLead ? form.whatsapp_number || null : null,
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
      <PageHeader title="New product" subtitle="List a product and launch its campaign in one step." />

      {status.success && <Alert severity="success" sx={{ mb: 3 }}>Product listed and campaign launched.</Alert>}
      {status.error && <Alert severity="error" sx={{ mb: 3 }}>{status.error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
          <Typography fontWeight={700} sx={{ mb: 0.5 }}>
            Product type
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
            Just determines which categories are available below — customers always pay you directly either way.
          </Typography>

          <ToggleButtonGroup
            value={form.product_type}
            exclusive
            onChange={(_, v) => v && update("product_type", v)}
            sx={{ width: "100%", gap: 2, "& .MuiToggleButtonGroup-grouped": { border: `1px solid ${tokens.border} !important`, borderRadius: "12px !important" } }}
          >
            <ToggleButton
              value="physical"
              sx={{ flex: 1, textTransform: "none", p: 2, gap: 1, "&.Mui-selected": { bgcolor: tokens.brand, "&:hover": { bgcolor: tokens.brand } } }}
            >
              <Inventory2RoundedIcon fontSize="small" />
              <Typography fontWeight={700}>Physical</Typography>
            </ToggleButton>
            <ToggleButton
              value="digital"
              sx={{ flex: 1, textTransform: "none", p: 2, gap: 1, "&.Mui-selected": { bgcolor: tokens.brand, "&:hover": { bgcolor: tokens.brand } } }}
            >
              <LaptopMacRoundedIcon fontSize="small" />
              <Typography fontWeight={700}>Digital</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
          <Typography fontWeight={700} sx={{ mb: 0.5 }}>
            Campaign goal
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
            This is what actually determines how Commission tracks and charges for results — pick what you are trying to get more of.
          </Typography>

          <ToggleButtonGroup
            value={form.conversion_goal}
            exclusive
            onChange={(_, v) => v && selectConversionGoal(v)}
            sx={{ width: "100%", gap: 2, "& .MuiToggleButtonGroup-grouped": { border: `1px solid ${tokens.border} !important`, borderRadius: "12px !important" } }}
          >
            <ToggleButton
              value="lead"
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
                <PersonSearchRoundedIcon fontSize="small" />
                <Typography fontWeight={700}>Leads</Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: isLead ? tokens.brandInk : tokens.muted, textAlign: "left" }}>
                Visitor fills a short form, gets a WhatsApp link, you qualify them when ready. You pay a flat amount per
                qualified lead — deducted from your campaign wallet.
              </Typography>
            </ToggleButton>
            <ToggleButton
              value="sale"
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
                <ShoppingBagRoundedIcon fontSize="small" />
                <Typography fontWeight={700}>Sales</Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: !isLead ? tokens.brandInk : tokens.muted, textAlign: "left" }}>
                Customer buys directly from you, you confirm the sale, commission is calculated as a % of the sale —
                deducted from your campaign wallet.
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
            <Grid item xs={12} sm={4}>
              <TextField
                label="Price (₦)"
                type="number"
                fullWidth
                required
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                helperText={isLead ? "Shown on your Campaign Page — not what you are billed for leads" : undefined}
              />
            </Grid>

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

            <Grid item xs={12} sm={isPhysical ? 8 : 4}>
              <TextField
                label="Where customers buy (your site, WhatsApp, store)"
                fullWidth
                required
                placeholder="https://wa.me/234... or https://yoursite.com"
                value={form.product_url}
                onChange={(e) => update("product_url", e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Payment & sale verification instructions"
                fullWidth
                multiline
                minRows={2}
                placeholder="e.g. Bank transfer to Zenith Bank 0123456789. We will ask for a receipt or order reference when confirming a sale."
                value={form.offline_payment_instructions}
                onChange={(e) => update("offline_payment_instructions", e.target.value)}
                helperText="Shown on your Campaign Page. Customers always pay you directly — Commission never touches this money."
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            {isLead ? "Lead pricing" : "Sale commission"}
          </Typography>

          {isLead ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Cost per qualified lead (₦)"
                  type="number"
                  fullWidth
                  required
                  value={form.cost_per_qualified_lead}
                  onChange={(e) => update("cost_per_qualified_lead", e.target.value)}
                  helperText="Deducted from your wallet each time you mark a lead qualified"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="WhatsApp number for this campaign"
                  fullWidth
                  placeholder="+234..."
                  value={form.whatsapp_number}
                  onChange={(e) => update("whatsapp_number", e.target.value)}
                  helperText="Leads get a unique link to this number after the short form. Leave blank to use your business default."
                />
              </Grid>
            </Grid>
          ) : (
            <ToggleButtonGroup value={form.commission_type} exclusive onChange={(_, v) => v && update("commission_type", v)} sx={{ mb: 1 }}>
              <ToggleButton value="one_time">One-time commission</ToggleButton>
              <ToggleButton value="recurring">Recurring commission</ToggleButton>
            </ToggleButtonGroup>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border }}>
          <Typography fontWeight={700} sx={{ mb: 0.5 }}>
            Affiliate tiers
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
            {isLead
              ? "Up to 3 tiers. These should sum to 100% — that is the whole lead fee, allocated across your affiliate tree, before Commission's plan-based fee is taken from each tier's share."
              : "Up to 3 tiers, as a % of the sale. Commission's plan-based fee is taken from this commission (never your sale price)."}
          </Typography>

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
              Total across tiers
            </Typography>
            <Typography
              fontWeight={700}
              color={totalCommission > 100 || (isLead && totalCommission !== 100) || (!isLead && totalCommission < 10) ? "error" : "inherit"}
            >
              {totalCommission}%{" "}
              {isLead && totalCommission !== 100
                ? "(should be 100%)"
                : !isLead && totalCommission < 10
                ? "(minimum 10% for direct-sale campaigns)"
                : ""}
            </Typography>
          </Stack>
        </Paper>

        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button type="submit" variant="contained" size="large" disabled={status.loading}>
            {status.loading ? "Publishing…" : "Publish product & campaign"}
          </Button>
        </Stack>
      </Box>
    </>
  );
}
