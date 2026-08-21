"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Tooltip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LaptopMacRoundedIcon from "@mui/icons-material/LaptopMacRounded";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";
import { categoriesForType } from "@/lib/categories";
import { TIER_RATIOS } from "@/lib/commissionEngine";

// Custom Questions cap, plan-based. Small: 1, Medium: 3, Large: 5.
const CUSTOM_FIELD_CAP = { free: 1, pro: 3, plus: 5 };

// Sane ceilings on naira fields, to prevent obviously abusive values (not
// a business-logic limit, just a guard rail). Generous enough that no
// legitimate real estate or high-ticket listing should ever hit them.
const MAX_PRICE_NAIRA = 500_000_000;
const MAX_COST_PER_LEAD_NAIRA = 1_000_000;

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
  cost_per_qualified_lead: "",
  commission_type: "one_time",
  // Only used for sale-goal campaigns - lead-goal always splits the whole
  // pool 50/30/20 (see TIER_RATIOS in lib/commissionEngine.js), fixed
  // platform-wide and not something a business can change.
  total_commission_percent: 10,
};

// Realistic worked examples for the "View sample campaign" preview -
// different content depending on which conversion goal is selected, so
// the preview always matches what the person is actually about to build.
const SAMPLE_CAMPAIGNS = {
  lead: {
    product_type: "Digital",
    name: "CareLink HMO Plan",
    category: "Insurance",
    price: "85,000",
    billing_frequency: "Monthly",
    description: "Individual HMO plan covering outpatient, inpatient, and maternity care across 200+ hospitals in Nigeria.",
    product_url: "https://carelink.ng/plans/individual",
    offline_payment_instructions: "Bank transfer to Zenith Bank 0123456789. We will ask for a receipt when confirming a sale.",
    cost_per_qualified_lead: "5,000",
    custom_field_example: { label: "Do you currently have health insurance?", type: "Dropdown", options: ["Yes", "No"] },
  },
  sale: {
    product_type: "Physical",
    name: "3-Bedroom Duplex, Lekki Phase 1",
    category: "Real Estate",
    price: "45,000,000",
    description: "Newly built 3-bedroom duplex with BQ, secure estate, 24-hour power - ready for immediate inspection.",
    product_url: "https://lekkihomes.ng/duplex-inquiry",
    total_commission_percent: 12,
  },
};

// Formats a raw digit string for display with thousand separators - the
// actual form state stores only the raw digits, this is display-only.
function formatNaira(rawDigits) {
  if (!rawDigits) return "";
  return Number(rawDigits).toLocaleString("en-US");
}
function stripToDigits(value) {
  return value.replace(/[^0-9]/g, "");
}
// Local Nigerian format only - 11 digits, e.g. 08012345678. No +234 typed
// here; that gets prepended wherever the number is actually used.
function formatPhoneDigits(value) {
  return stripToDigits(value).slice(0, 11);
}

// Small reusable label - every field gets one of these instead of a plain
// MUI label, so there is always a hoverable info icon with a real example,
// not just a bare field name.
function FieldLabel({ text, tooltip }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.75 }}>
      <Typography variant="body2" fontWeight={600}>
        {text}
      </Typography>
      <Tooltip title={tooltip} arrow placement="top">
        <InfoOutlinedIcon sx={{ fontSize: 15, color: tokens.muted, cursor: "help" }} />
      </Tooltip>
    </Stack>
  );
}

function SampleField({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: tokens.muted }}>{label}</Typography>
      <Typography fontWeight={700}>{value}</Typography>
    </Box>
  );
}

function SampleCampaignDialog({ open, onClose, isLead }) {
  const sample = isLead ? SAMPLE_CAMPAIGNS.lead : SAMPLE_CAMPAIGNS.sale;
  const totalPercent = isLead ? 100 : sample.total_commission_percent;
  const tier1 = (totalPercent * TIER_RATIOS.tier1) / 100;
  const tier2 = (totalPercent * TIER_RATIOS.tier2) / 100;
  const tier3 = (totalPercent * TIER_RATIOS.tier3) / 100;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Sample {isLead ? "lead" : "sale"} campaign
        <Typography variant="body2" sx={{ color: tokens.muted, fontWeight: 400, mt: 0.5 }}>
          A complete, realistic example - every field filled in exactly how a real campaign would look.
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="overline" sx={{ color: tokens.muted, fontWeight: 700 }}>
            Campaign details
          </Typography>
          <SampleField label="Campaign type" value={sample.product_type} />
          <SampleField label="Campaign name" value={sample.name} />
          <SampleField label="Category" value={sample.category} />
          <SampleField label="Description" value={sample.description} />
          <SampleField label="Price" value={`₦${sample.price}`} />
          {isLead && <SampleField label="Billing frequency" value={sample.billing_frequency} />}
          <SampleField label="Where customers buy" value={sample.product_url} />
          {isLead && <SampleField label="Payment & sale verification instructions" value={sample.offline_payment_instructions} />}

          <Divider />
          <Typography variant="overline" sx={{ color: tokens.muted, fontWeight: 700 }}>
            {isLead ? "Lead pricing" : "Sale commission"}
          </Typography>
          {isLead ? (
            <SampleField label="Cost per Intent Qualified Lead" value={`₦${sample.cost_per_qualified_lead}`} />
          ) : (
            <SampleField label="Total commission" value={`${sample.total_commission_percent}%`} />
          )}

          {isLead && (
            <>
              <Divider />
              <Typography variant="overline" sx={{ color: tokens.muted, fontWeight: 700 }}>
                Custom question example
              </Typography>
              <Box>
                <Typography variant="caption" sx={{ color: tokens.muted }}>Question</Typography>
                <Typography fontWeight={700}>{sample.custom_field_example.label}</Typography>
                <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mt: 0.5 }}>
                  Type: {sample.custom_field_example.type} · Options: {sample.custom_field_example.options.join(", ")}
                </Typography>
              </Box>
            </>
          )}

          <Divider />
          <Typography variant="overline" sx={{ color: tokens.muted, fontWeight: 700 }}>
            How the affiliate payout splits, on this example
          </Typography>
          <Stack direction="row" spacing={2}>
            {[
              { tier: 1, percent: tier1 },
              { tier: 2, percent: tier2 },
              { tier: 3, percent: tier3 },
            ].map((t) => (
              <Box key={t.tier} sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: "#F7F6F2", textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
                  Tier {t.tier}
                </Typography>
                <Typography fontWeight={800}>{t.percent}%</Typography>
              </Box>
            ))}
          </Stack>
          <Typography variant="caption" sx={{ color: tokens.muted }}>
            {isLead
              ? `That's ₦${Math.round((tier1 / 100) * Number(sample.cost_per_qualified_lead.replace(/,/g, ""))).toLocaleString()} paid to the tier-1 affiliate per qualified lead, before Commission's plan fee.`
              : `On a ₦${sample.price} sale, tier 1 earns ₦${Math.round((tier1 / 100) * Number(sample.price.replace(/,/g, ""))).toLocaleString()}, before Commission's plan fee.`}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [form, setForm] = useState(DEFAULTS);
  const [status, setStatus] = useState({ loading: false, error: null, success: false });
  const [customFields, setCustomFields] = useState([]);
  const [plan, setPlan] = useState(null);
  const [showSample, setShowSample] = useState(false);
  const [profileCheck, setProfileCheck] = useState({ loading: true, complete: true });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: userRow } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single();
      if (!userRow) return;
      const { data: biz } = await supabase.from("businesses").select("plan, name, industry").eq("owner_id", userRow.id).maybeSingle();
      setPlan(biz?.plan || "free");
      // A campaign needs a real business identity behind it - name and
      // industry are the minimum. Website stays optional.
      setProfileCheck({ loading: false, complete: !!(biz?.name && biz?.industry) });
    });
  }, []);

  const fieldCap = CUSTOM_FIELD_CAP[plan] ?? CUSTOM_FIELD_CAP.free;

  function addCustomField() {
    if (customFields.length >= fieldCap) return;
    setCustomFields((f) => [...f, { label: "", field_type: "text", options: [""], required: false }]);
  }
  function updateCustomField(i, patch) {
    setCustomFields((f) => f.map((field, idx) => (idx === i ? { ...field, ...patch } : field)));
  }
  function removeCustomField(i) {
    setCustomFields((f) => f.filter((_, idx) => idx !== i));
  }
  function addDropdownOption(fieldIndex) {
    setCustomFields((f) =>
      f.map((field, idx) => (idx === fieldIndex ? { ...field, options: [...field.options, ""] } : field))
    );
  }
  function updateDropdownOption(fieldIndex, optionIndex, value) {
    setCustomFields((f) =>
      f.map((field, idx) =>
        idx === fieldIndex
          ? { ...field, options: field.options.map((o, oi) => (oi === optionIndex ? value : o)) }
          : field
      )
    );
  }
  function removeDropdownOption(fieldIndex, optionIndex) {
    setCustomFields((f) =>
      f.map((field, idx) =>
        idx === fieldIndex ? { ...field, options: field.options.filter((_, oi) => oi !== optionIndex) } : field
      )
    );
  }

  const isPhysical = form.product_type === "physical";
  const isLead = form.conversion_goal === "lead";
  const categoryOptions = categoriesForType(form.product_type);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  function updateNairaField(field, displayValue) {
    update(field, stripToDigits(displayValue));
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
    if (customFields.some((f) => f.field_type === "select" && f.options.filter((o) => o.trim()).length < 2)) {
      setStatus({ loading: false, error: "Every dropdown question needs at least 2 options.", success: false });
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

      // 2. Create the product/campaign. Customers always pay you directly
      // (product_url, offline_payment_instructions) regardless of physical
      // vs digital — that toggle only affects which categories are available.
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
      if (productError) {
        // Postgres's raw unique-constraint message isn't something a
        // business user should have to parse - the field itself now also
        // carries a warning, this is the fallback if they hit it anyway.
        if (productError.code === "23505") {
          throw new Error("You already have a campaign with this exact name. Choose a different name and try again.");
        }
        throw productError;
      }

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
          tier1_percent: tier1Percent,
          tier2_percent: tier2Percent,
          tier3_percent: tier3Percent,
          status: "active",
        })
        .select()
        .single();
      if (programError) throw programError;

      // 4. Custom Questions - the business's own Intent Form fields for
      // this specific campaign. Only meaningful for lead-goal campaigns,
      // which are the only ones with an Intent Form at all. Dropdown
      // options are now real separate strings, not a comma-joined blob.
      if (isLead && customFields.length > 0) {
        const { error: fieldsError } = await supabase.from("campaign_custom_fields").insert(
          customFields.map((f, i) => ({
            affiliate_program_id: program.id,
            label: f.label,
            field_type: f.field_type,
            options:
              f.field_type === "select"
                ? f.options
                    .filter((o) => o.trim())
                    .map((o) => (f.option_format === "text" || !f.option_format ? o.trim() : f.option_format === "price" ? `₦${formatNaira(o)}` : formatNaira(o)))
                : null,
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
      // The success banner now links to /dashboard/campaigns, which already
      // shows clickable rows leading to each campaign's edit page - that
      // serves the "somewhere to go after publishing" need well enough
      // without needing a dedicated detail page or the deferred
      // products -> campaigns rename.
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: false });
    }
  }

  if (!profileCheck.loading && !profileCheck.complete) {
    return (
      <>
        <PageHeader title="New campaign" subtitle="List what you're selling and launch its affiliate program in one step." />
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your business profile isn't complete yet - a campaign needs a business name and industry behind it before
          it can go live.
        </Alert>
        <Button variant="contained" href="/dashboard/account">
          Complete your business profile
        </Button>
      </>
    );
  }

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <PageHeader title="New campaign" subtitle="List what you're selling and launch its affiliate program in one step." />
        <Button
          variant="outlined"
          startIcon={<VisibilityRoundedIcon />}
          onClick={() => setShowSample(true)}
          sx={{ flexShrink: 0, mt: { xs: 0, sm: 1 } }}
        >
          View sample campaign
        </Button>
      </Stack>

      <SampleCampaignDialog open={showSample} onClose={() => setShowSample(false)} isLead={isLead} />

      {status.success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => router.push("/dashboard/campaigns")}>
              View my campaigns
            </Button>
          }
        >
          Campaign published.
        </Alert>
      )}
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
                Visitor fills an interest form, goes straight to a details form, you qualify them when ready. You pay
                a flat amount per Intent Qualified Lead — deducted from your campaign wallet.
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
              <FieldLabel
                text="Campaign name"
                tooltip='What this campaign is called - shown to affiliates and on your campaign page. Must be unique across your own campaigns. Example: "CareLink HMO Plan" or "3-Bedroom Duplex, Lekki Phase 1".'
              />
              <TextField
                fullWidth
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                helperText="Must be different from any other campaign name you've already used."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FieldLabel text="Category" tooltip="The category your campaign is listed under in Discover, so affiliates can find it. Example: Insurance, Real Estate, Fintech." />
              <TextField select fullWidth required value={form.category} onChange={(e) => update("category", e.target.value)}>
                {categoryOptions.map((c) => (
                  <MenuItem key={c.slug} value={c.label}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <FieldLabel
                text="Description"
                tooltip='A short, clear description shown to affiliates and prospects. Example: "Individual HMO plan covering outpatient, inpatient, and maternity care across 200+ hospitals in Nigeria."'
              />
              <TextField
                fullWidth
                multiline
                minRows={2}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FieldLabel
                text="Price (₦)"
                tooltip='The price shown to customers on your campaign page - separate from what you pay Commission per lead or sale, which is set further below. Example: "85,000" for an HMO plan, "45,000,000" for a property.'
              />
              <TextField
                fullWidth
                required
                value={formatNaira(form.price)}
                onChange={(e) => updateNairaField("price", e.target.value)}
                inputMode="numeric"
                InputProps={{ startAdornment: <InputAdornment position="start">₦</InputAdornment> }}
                helperText={
                  Number(form.price) > MAX_PRICE_NAIRA
                    ? `Maximum ₦${MAX_PRICE_NAIRA.toLocaleString()}`
                    : "The price customers see - not what Commission charges you"
                }
                error={Number(form.price) > MAX_PRICE_NAIRA}
              />
            </Grid>

            {!isPhysical && (
              <Grid item xs={12} sm={4}>
                <FieldLabel text="Billing frequency" tooltip="How often the customer is charged for this product. Example: Monthly for a subscription, One-time for a single purchase." />
                <TextField
                  select
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
              <FieldLabel
                text="Where customers buy"
                tooltip='The link or number customers use to actually complete their purchase - your website, a store link, or a booking page. Example: "https://yoursite.com/checkout" or "https://yoursite.com/book-inspection".'
              />
              <TextField
                fullWidth
                required
                placeholder="https://wa.me/234... or https://yoursite.com"
                value={form.product_url}
                onChange={(e) => update("product_url", e.target.value)}
              />
            </Grid>

            {isLead && (
              <Grid item xs={12}>
                <FieldLabel
                  text="Payment & sale verification instructions"
                  tooltip='Only for lead campaigns - sale campaigns already route customers straight into a real Paystack checkout automatically, so there is nothing to explain manually. Example: "Bank transfer to Zenith Bank 0123456789. We will ask for a receipt or order reference when confirming a sale."'
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="e.g. Bank transfer to Zenith Bank 0123456789. We will ask for a receipt or order reference when confirming a sale."
                  value={form.offline_payment_instructions}
                  onChange={(e) => update("offline_payment_instructions", e.target.value)}
                  helperText="Shown on your campaign page. Customers always pay you directly — Commission never touches this money."
                />
              </Grid>
            )}
          </Grid>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            {isLead ? "Lead pricing" : "Sale commission"}
          </Typography>

          {isLead ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FieldLabel
                  text="Cost per Intent Qualified Lead (₦)"
                  tooltip='What you pay, from your Campaign Wallet, every time a lead qualifies through this campaign. Example: "5,000" for an HMO plan, "20,000" for a real estate inspection request.'
                />
                <TextField
                  fullWidth
                  required
                  value={formatNaira(form.cost_per_qualified_lead)}
                  onChange={(e) => updateNairaField("cost_per_qualified_lead", e.target.value)}
                  inputMode="numeric"
                InputProps={{ startAdornment: <InputAdornment position="start">₦</InputAdornment> }}
                  helperText={
                    Number(form.cost_per_qualified_lead) > MAX_COST_PER_LEAD_NAIRA
                      ? `Maximum ₦${MAX_COST_PER_LEAD_NAIRA.toLocaleString()} per lead`
                      : "Deducted from your wallet each time a lead qualifies"
                  }
                  error={Number(form.cost_per_qualified_lead) > MAX_COST_PER_LEAD_NAIRA}
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
              Add your own questions to this campaign&apos;s Intent Form - answers get forwarded straight to you, the
              same as name and phone. Commission never stores the answers, only these question definitions.
            </Typography>

            <Stack spacing={2.5} sx={{ mb: 2 }}>
              {customFields.map((f, i) => (
                <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: tokens.border, bgcolor: "#FAFAF8" }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: f.field_type === "select" ? 1.5 : 0 }}>
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
                      sx={{ minWidth: 120 }}
                      value={f.field_type}
                      onChange={(e) => updateCustomField(i, { field_type: e.target.value })}
                    >
                      <MenuItem value="text">Text</MenuItem>
                      <MenuItem value="number">Number</MenuItem>
                      <MenuItem value="price">Price</MenuItem>
                      <MenuItem value="select">Dropdown</MenuItem>
                    </TextField>
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

                  {f.field_type === "price" && (
                    <Box sx={{ pl: 0.5 }}>
                      <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mb: 1 }}>
                        Preview - this is how the prospect will see it, not something you fill in now:
                      </Typography>
                      <TextField
                        size="small"
                        disabled
                        value="2,500,000"
                        InputProps={{ startAdornment: <InputAdornment position="start">₦</InputAdornment> }}
                        sx={{ maxWidth: 220 }}
                      />
                    </Box>
                  )}
                  {f.field_type === "number" && (
                    <Box sx={{ pl: 0.5 }}>
                      <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mb: 1 }}>
                        Preview - this is how the prospect will see it, not something you fill in now:
                      </Typography>
                      <TextField size="small" disabled value="2,500,000" sx={{ maxWidth: 220 }} />
                    </Box>
                  )}

                  {f.field_type === "select" && (
                    <Box sx={{ pl: 0.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="caption" sx={{ color: tokens.muted }}>
                          Dropdown options - each one its own field, not comma-separated. Option format:
                        </Typography>
                        <TextField
                          select
                          size="small"
                          value={f.option_format || "text"}
                          onChange={(e) => updateCustomField(i, { option_format: e.target.value })}
                          sx={{ minWidth: 100 }}
                        >
                          <MenuItem value="text">Text</MenuItem>
                          <MenuItem value="number">Number</MenuItem>
                          <MenuItem value="price">Price</MenuItem>
                        </TextField>
                      </Stack>
                      <Stack spacing={1}>
                        {f.options.map((opt, oi) => {
                          const optFormat = f.option_format || "text";
                          const displayValue = optFormat === "text" ? opt : formatNaira(opt);
                          return (
                            <Stack key={oi} direction="row" spacing={1} alignItems="center">
                              <TextField
                                size="small"
                                fullWidth
                                placeholder={`Option ${oi + 1}`}
                                value={displayValue}
                                inputMode={optFormat === "text" ? "text" : "numeric"}
                                InputProps={optFormat === "price" ? { startAdornment: <InputAdornment position="start">₦</InputAdornment> } : undefined}
                                onChange={(e) =>
                                  updateDropdownOption(
                                    i,
                                    oi,
                                    optFormat === "text" ? e.target.value : stripToDigits(e.target.value)
                                  )
                                }
                              />
                              <IconButton size="small" onClick={() => removeDropdownOption(i, oi)} disabled={f.options.length <= 1}>
                                <DeleteOutlineRoundedIcon fontSize="small" sx={{ color: tokens.muted }} />
                              </IconButton>
                            </Stack>
                          );
                        })}
                      </Stack>
                      <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => addDropdownOption(i)} sx={{ mt: 1 }}>
                        Add option
                      </Button>
                    </Box>
                  )}
                </Paper>
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
              <FieldLabel
                text="Total commission (%)"
                tooltip='The total percentage of the sale price paid out across all 3 tiers combined - minimum 10%. Example: "12" means 12% of the sale price goes to affiliates, split 50/30/20 across tiers automatically.'
              />
              <TextField
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
