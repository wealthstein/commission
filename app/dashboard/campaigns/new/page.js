"use client";

import { useState, useEffect } from "react";
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
  IconButton,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LaptopMacRoundedIcon from "@mui/icons-material/LaptopMacRounded";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";
import { categoriesForType } from "@/lib/categories";
import { TIER_RATIOS } from "@/lib/commissionEngine";

// Custom Questions cap, plan-based (subscriptions are back). Cumulative:
// Small gets 3, Medium gets 2 more on top (5 total), Large gets 3 more on
// top of that (8 total) - see content/pricingPlans.json for the same
// numbers stated to the person.
const CUSTOM_FIELD_CAP = { free: 3, pro: 5, plus: 8 };

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
  // Only used for sale-goal campaigns - lead-goal always splits the whole
  // pool 50/30/20 (see TIER_RATIOS in lib/commissionEngine.js), fixed
  // platform-wide and not something a business can change.
  total_commission_percent: 10,
};

export default function NewCampaignPage() {
  const [form, setForm] = useState(DEFAULTS);
  const [status, setStatus] = useState({ loading: false, error: null, success: false });
  const [customFields, setCustomFields] = useState([]);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: userRow } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single();
      if (!userRow) return;
      const { data: biz } = await supabase.from("businesses").select("plan").eq("owner_id", userRow.id).maybeSingle();
      setPlan(biz?.plan || "free");
    });
  }, []);

  const fieldCap = CUSTOM_FIELD_CAP[plan] ?? CUSTOM_FIELD_CAP.free;

  function addCustomField() {
    if (customFields.length >= fieldCap) return;
    setCustomFields((f) => [...f, { label: "", field_type: "text", options: "", required: false }]);
  }
  function updateCustomField(i, patch) {
    setCustomFields((f) => f.map((field, idx) => (idx === i ? { ...field, ...patch } : field)));
  }
  function removeCustomField(i) {
    setCustomFields((f) => f.filter((_, idx) => idx !== i));
  }

  const isPhysical = form.product_type === "physical";
  const isLead = form.conversion_goal === "lead";
  const categoryOptions = categoriesForType(form.product_type);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function selectConversionGoal(goal) {
    setForm((f) => ({ ...f, conversion_goal: goal }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    if (!isLead && Number(form.total_commission_percent) < 10) {
      setStatus({
        loading: false,
        error: "Direct-sale campaigns must commit at least 10% total commission across tiers.",
        success: false,
      });
      return;
    }
    if (!isLead && Number(form.total_commission_percent) > 100) {
      setStatus({ loading: false, error: "Total commission cannot exceed 100%.", success: false });
      return;
    }
    if (isLead && !form.cost_per_qualified_lead) {
      setStatus({ loading: false, error: "Set a cost per Intent Qualified Lead for a lead campaign.", success: false });
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

      const { data: userRow } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single();

      // 1. Ensure the caller has a business profile (created on first product
      // listing). Explicitly scoped to this user's own business - previously
      // this used .limit(1) with no owner filter, which could grab whichever
      // business happened to be first in the whole table.
      const { data: existingBusiness } = await supabase.from("businesses").select("id").eq("owner_id", userRow.id).maybeSingle();
      let businessId = existingBusiness?.id;

      if (!businessId) {
        const { data: newBusiness, error: bizError } = await supabase
          .from("businesses")
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
          offline_payment_instructions: form.offline_payment_instructions || null,
          status: "active",
        })
        .select()
        .single();
      if (productError) throw productError;

      // 3. Launch the campaign. A lead campaign has no "commission_type" —
      // there is nothing to recur, only sale-goal campaigns can be recurring.
      // Tier split is fixed platform-wide (TIER_RATIOS: 50/30/20) - a
      // business cannot change the relative proportions. For lead-goal
      // campaigns this IS the tier split (the whole pool). For sale-goal,
      // the business's single "total commission %" gets divided in these
      // exact proportions.
      const totalPercent = isLead ? 100 : Number(form.total_commission_percent);
      const tier1Percent = (totalPercent * TIER_RATIOS.tier1) / 100;
      const tier2Percent = (totalPercent * TIER_RATIOS.tier2) / 100;
      const tier3Percent = (totalPercent * TIER_RATIOS.tier3) / 100;

      const { data: program, error: programError } = await supabase
        .from("affiliate_programs")
        .insert({
          product_id: product.id,
          conversion_goal: form.conversion_goal,
          commission_type: isLead ? "one_time" : form.commission_type,
          cost_per_qualified_lead_naira: isLead ? Number(form.cost_per_qualified_lead) : null,
          whatsapp_number: isLead ? form.whatsapp_number || null : null,
          tier1_percent: tier1Percent,
          tier2_percent: tier2Percent,
          tier3_percent: tier3Percent,
          status: "active",
        })
        .select()
        .single();
      if (programError) throw programError;

      // 4. Custom Questions (Medium/Large only) - the business's own Long
      // Form fields for this specific campaign. Only meaningful for
      // lead-goal campaigns, which are the only ones with a Long Form at all.
      if (isLead && customFields.length > 0) {
        const { error: fieldsError } = await supabase.from("campaign_custom_fields").insert(
          customFields.map((f, i) => ({
            affiliate_program_id: program.id,
            label: f.label,
            field_type: f.field_type,
            options: f.field_type === "select" ? f.options.split(",").map((o) => o.trim()).filter(Boolean) : null,
            required: f.required,
            display_order: i,
          }))
        );
        if (fieldsError) throw fieldsError;
      }

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
      <PageHeader title="New campaign" subtitle="List what you're selling and launch its affiliate program in one step." />

      {status.success && <Alert severity="success" sx={{ mb: 3 }}>Campaign published.</Alert>}
      {status.error && <Alert severity="error" sx={{ mb: 3 }}>{status.error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
          <Typography fontWeight={700} sx={{ mb: 0.5 }}>
            Campaign type
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
                Intent Qualified Lead — deducted from your campaign wallet.
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
            Campaign details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField label="Campaign name" fullWidth required value={form.name} onChange={(e) => update("name", e.target.value)} />
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
                  label="Cost per Intent Qualified Lead (₦)"
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

        {isLead && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
            <Typography fontWeight={700} sx={{ mb: 0.5 }}>
              Custom questions
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
              Add your own questions to this campaign&apos;s Long Form - answers get forwarded straight to you, the
              same as name and phone. Commission never stores the answers, only these question definitions.
            </Typography>

            <Stack spacing={2} sx={{ mb: 2 }}>
                  {customFields.map((f, i) => (
                    <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                      <TextField
                        label="Question"
                        size="small"
                        fullWidth
                        value={f.label}
                        onChange={(e) => updateCustomField(i, { label: e.target.value })}
                      />
                      <TextField
                        select
                        label="Type"
                        size="small"
                        sx={{ minWidth: 110 }}
                        value={f.field_type}
                        onChange={(e) => updateCustomField(i, { field_type: e.target.value })}
                      >
                        <MenuItem value="text">Text</MenuItem>
                        <MenuItem value="select">Dropdown</MenuItem>
                      </TextField>
                      {f.field_type === "select" && (
                        <TextField
                          label="Options (comma-separated)"
                          size="small"
                          fullWidth
                          value={f.options}
                          onChange={(e) => updateCustomField(i, { options: e.target.value })}
                          placeholder="Under ₦500k, ₦500k-2m, Above ₦2m"
                        />
                      )}
                      <FormControlLabel
                        sx={{ flexShrink: 0, ml: 0 }}
                        control={
                          <Checkbox
                            size="small"
                            checked={f.required}
                            onChange={(e) => updateCustomField(i, { required: e.target.checked })}
                          />
                        }
                        label="Required"
                      />
                      <IconButton size="small" onClick={() => removeCustomField(i)}>
                        <DeleteOutlineRoundedIcon fontSize="small" sx={{ color: tokens.muted }} />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
                <Button
                  size="small"
                  startIcon={<AddRoundedIcon />}
                  onClick={addCustomField}
                  disabled={customFields.length >= fieldCap}
                >
                  Add question
                </Button>
                <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mt: 1 }}>
                  {customFields.length}/{fieldCap} questions used.
                </Typography>
          </Paper>
        )}

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border }}>
          <Typography fontWeight={700} sx={{ mb: 0.5 }}>
            Affiliate tiers
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
            Commission's tier split is fixed platform-wide - this keeps the multi-tier incentive consistent for
            every affiliate, on every campaign. It is not something a business can adjust.
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mb: !isLead ? 3 : 0 }}>
            {[
              { tier: 1, percent: TIER_RATIOS.tier1, note: "Direct affiliate" },
              { tier: 2, percent: TIER_RATIOS.tier2, note: "Who referred tier 1" },
              { tier: 3, percent: TIER_RATIOS.tier3, note: "Who referred tier 2" },
            ].map((t) => (
              <Box
                key={t.tier}
                sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: "#F7F6F2", textAlign: "center" }}
              >
                <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mb: 0.5 }}>
                  Tier {t.tier}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ color: tokens.brandInk }}>
                  {t.percent}%
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.muted }}>
                  {t.note}
                </Typography>
              </Box>
            ))}
          </Stack>

          {isLead ? (
            <Typography variant="body2" sx={{ color: tokens.muted, mt: 2 }}>
              This splits your full cost per Intent Qualified Lead - Commission's plan-based fee is then taken from
              each tier's share, never from your sale price.
            </Typography>
          ) : (
            <>
              <Divider sx={{ my: 3 }} />
              <TextField
                label="Total commission (%)"
                type="number"
                value={form.total_commission_percent}
                onChange={(e) => update("total_commission_percent", e.target.value)}
                helperText="Minimum 10% - divided 50/30/20 across tiers automatically. Commission's plan-based fee is taken from this commission, never your sale price."
                sx={{ maxWidth: 320 }}
              />
              {(Number(form.total_commission_percent) < 10 || Number(form.total_commission_percent) > 100) && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {Number(form.total_commission_percent) < 10 ? "Minimum 10% total for direct-sale campaigns." : "Cannot exceed 100%."}
                </Typography>
              )}
            </>
          )}
        </Paper>

        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button type="submit" variant="contained" size="large" disabled={status.loading}>
            {status.loading ? "Publishing…" : "Publish campaign"}
          </Button>
        </Stack>
      </Box>
    </>
  );
}
