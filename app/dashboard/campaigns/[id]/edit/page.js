"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Paper,
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  Grid,
  Alert,
  InputAdornment,
  CircularProgress,
  Chip,
} from "@mui/material";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";
import { categoriesForType } from "@/lib/categories";
import { TIER_RATIOS } from "@/lib/commissionEngine";

const MAX_PRICE_NAIRA = 500_000_000;
const MAX_COST_PER_LEAD_NAIRA = 1_000_000;

const BILLING = [
  { value: "one_time", label: "One-time" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

function formatNaira(rawDigits) {
  if (!rawDigits) return "";
  return Number(rawDigits).toLocaleString("en-US");
}
function stripToDigits(value) {
  return value.replace(/[^0-9]/g, "");
}

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notFoundOrNotOwner, setNotFoundOrNotOwner] = useState(false);
  const [isLead, setIsLead] = useState(true);
  const [isPhysical, setIsPhysical] = useState(false);
  const [form, setForm] = useState(null);
  const [businessPlan, setBusinessPlan] = useState(null);
  const [businessWebsiteUrl, setBusinessWebsiteUrl] = useState(null);
  const [status, setStatus] = useState({ loading: false, error: null, success: false });

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: campaign, error } = await supabase
        .from("campaigns")
        .select("*, affiliate_programs(*), businesses(plan, website_url)")
        .eq("id", params.id)
        .maybeSingle();

      // RLS already scopes this to campaigns the signed-in user's own
      // business owns - a null result here means either it doesn't exist
      // or it isn't theirs, and those should look the same to the caller.
      if (error || !campaign) {
        setNotFoundOrNotOwner(true);
        setLoading(false);
        return;
      }

      const program = campaign.affiliate_programs?.[0];
      setIsLead(program?.conversion_goal === "lead");
      setIsPhysical(campaign.product_type === "physical");
      setBusinessPlan(campaign.businesses?.plan || "free");
      setBusinessWebsiteUrl(campaign.businesses?.website_url || null);

      const totalCommissionPercent = program
        ? Math.round((program.tier1_percent / TIER_RATIOS.tier1) * 100)
        : 10;

      setForm({
        campaignId: campaign.id,
        programId: program?.id,
        name: campaign.name,
        category: campaign.category || "",
        description: campaign.description || "",
        price: String(campaign.price_naira ?? ""),
        billing_frequency: campaign.billing_frequency || "one_time",
        product_url: campaign.product_url || "",
        offline_payment_instructions: campaign.offline_payment_instructions || "",
        cost_per_qualified_lead: program?.cost_per_qualified_lead_naira != null ? String(program.cost_per_qualified_lead_naira) : "",
        commission_type: program?.commission_type || "one_time",
        total_commission_percent: totalCommissionPercent,
      });
      setLoading(false);
    }
    load();
  }, [params.id]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  function updateNairaField(field, displayValue) {
    update(field, stripToDigits(displayValue));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    if (!isLead && (Number(form.total_commission_percent) < 10 || Number(form.total_commission_percent) > 100)) {
      setStatus({
        loading: false,
        error: Number(form.total_commission_percent) < 10 ? "Minimum 10% total for direct-sale campaigns." : "Total commission cannot exceed 100%.",
        success: false,
      });
      return;
    }
    if (isLead && !form.cost_per_qualified_lead) {
      setStatus({ loading: false, error: "Set a cost per Intent Qualified Lead for a lead campaign.", success: false });
      return;
    }

    try {
      const supabase = createClient();

      const { error: campaignError } = await supabase
        .from("campaigns")
        .update({
          name: form.name,
          category: form.category,
          description: form.description,
          price_naira: Number(form.price),
          billing_frequency: isPhysical ? "one_time" : form.billing_frequency,
          product_url: form.product_url,
          offline_payment_instructions: form.offline_payment_instructions || null,
        })
        .eq("id", form.campaignId);
      if (campaignError) {
        if (campaignError.code === "23505") {
          throw new Error("You already have a campaign with this exact name. Choose a different name and try again.");
        }
        throw campaignError;
      }

      if (form.programId) {
        const totalPercent = isLead ? 100 : Number(form.total_commission_percent);
        const tier1Percent = (totalPercent * TIER_RATIOS.tier1) / 100;
        const tier2Percent = (totalPercent * TIER_RATIOS.tier2) / 100;
        const tier3Percent = (totalPercent * TIER_RATIOS.tier3) / 100;

        const { error: programError } = await supabase
          .from("affiliate_programs")
          .update({
            commission_type: isLead ? "one_time" : form.commission_type,
            cost_per_qualified_lead_naira: isLead ? Number(form.cost_per_qualified_lead) : null,
            tier1_percent: tier1Percent,
            tier2_percent: tier2Percent,
            tier3_percent: tier3Percent,
          })
          .eq("id", form.programId);
        if (programError) throw programError;
      }

      setStatus({ loading: false, error: null, success: true });
      router.push("/dashboard/campaigns");
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: false });
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notFoundOrNotOwner) {
    return (
      <>
        <PageHeader title="Campaign not found" subtitle="This campaign doesn't exist, or isn't one of yours." />
        <Button variant="contained" href="/dashboard/campaigns">
          Back to My Campaigns
        </Button>
      </>
    );
  }

  const categoryOptions = categoriesForType(isPhysical ? "physical" : "digital");

  return (
    <>
      <PageHeader title="Edit campaign" subtitle="Update your campaign's details, pricing, and lead settings." />

      {status.error && <Alert severity="error" sx={{ mb: 3 }}>{status.error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
            <Typography fontWeight={700}>Campaign goal</Typography>
            <Chip size="small" label={isLead ? "Leads" : "Sales"} sx={{ fontWeight: 700 }} />
          </Stack>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            Not editable after a campaign is live - switching between lead and sale tracking could conflict with
            history that's already been recorded. Create a new campaign if you need the other type.
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            Campaign details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Campaign name"
                fullWidth
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                helperText="Must be different from any other campaign name you've already used."
              />
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
                fullWidth
                required
                value={formatNaira(form.price)}
                onChange={(e) => updateNairaField("price", e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start">₦</InputAdornment> }}
                inputMode="numeric"
                helperText={Number(form.price) > MAX_PRICE_NAIRA ? `Maximum ₦${MAX_PRICE_NAIRA.toLocaleString()}` : " "}
                error={Number(form.price) > MAX_PRICE_NAIRA}
              />
            </Grid>
            {!isPhysical && (
              <Grid item xs={12} sm={4}>
                <TextField select label="Billing frequency" fullWidth value={form.billing_frequency} onChange={(e) => update("billing_frequency", e.target.value)}>
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
                label="Where customers buy"
                fullWidth
                required
                value={form.product_url}
                onChange={(e) => update("product_url", e.target.value)}
              />
            </Grid>
            {isLead && (
              <Grid item xs={12}>
                <TextField
                  label="Payment & sale verification instructions"
                  fullWidth
                  multiline
                  minRows={2}
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
                <TextField
                  label="Cost per Intent Qualified Lead (₦)"
                  fullWidth
                  required
                  value={formatNaira(form.cost_per_qualified_lead)}
                  onChange={(e) => updateNairaField("cost_per_qualified_lead", e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">₦</InputAdornment> }}
                  inputMode="numeric"
                  helperText={
                    Number(form.cost_per_qualified_lead) > MAX_COST_PER_LEAD_NAIRA
                      ? `Maximum ₦${MAX_COST_PER_LEAD_NAIRA.toLocaleString()} per lead`
                      : " "
                  }
                  error={Number(form.cost_per_qualified_lead) > MAX_COST_PER_LEAD_NAIRA}
                />
              </Grid>
            </Grid>
          ) : (
            <TextField
              label="Total commission (%)"
              type="number"
              value={form.total_commission_percent}
              onChange={(e) => update("total_commission_percent", e.target.value)}
              helperText="Minimum 10% - divided 50/30/20 across tiers automatically."
              sx={{ maxWidth: 320 }}
            />
          )}
        </Paper>

        {isLead && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Editing custom questions isn't available on this page yet - the questions you already set up when
            creating this campaign are unaffected and still live.
          </Alert>
        )}

        {isLead && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              Custom integration
            </Typography>
            {businessPlan === "pro" || businessPlan === "plus" ? (
              <>
                <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
                  Capture leads directly on your own site instead of sending customers to Commission's hosted page.
                  Add this script tag, then call <code>Commission.trackLead(...)</code> from your own form&apos;s submit
                  handler.
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "#0B0B0C",
                    color: "#E7E5DE",
                    fontSize: 13,
                    overflowX: "auto",
                    mb: 2,
                  }}
                >
                  {`<script src="https://commission.ng/commission-track.js" data-program="${form.programId}"></script>`}
                </Box>
                <Alert severity="warning" sx={{ mb: 0 }}>
                  Leads captured this way skip Radar&apos;s inline verification step entirely - that step depends on
                  rendering into Commission's own hosted page, which does not apply to a form on your own site. Every
                  lead submitted through your own page is created directly, regardless of the referring affiliate's
                  trust status. Worth knowing before relying on this heavily for high-volume or high-risk campaigns.
                </Alert>
              </>
            ) : (
              <Typography variant="body2" sx={{ color: tokens.muted }}>
                Custom integrations are available on Medium and Large plans.{" "}
                <Box component={Link} href="/dashboard/account" sx={{ color: tokens.ink, fontWeight: 600 }}>
                  View plans
                </Box>
              </Typography>
            )}
          </Paper>
        )}

        {!isLead && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              Website integration
            </Typography>
            {businessWebsiteUrl ? (
              <>
                <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
                  Sale-goal campaigns run entirely on your own site - customers check out there, never on a
                  Commission-hosted page. Add this script tag, then call{" "}
                  <code>Commission.initiateSaleCheckout()</code> from your own &quot;Subscribe&quot;/&quot;Buy&quot;
                  button&apos;s click handler.
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "#0B0B0C",
                    color: "#E7E5DE",
                    fontSize: 13,
                    overflowX: "auto",
                    mb: 2,
                  }}
                >
                  {`<script src="https://commission.ng/commission-track.js" data-program="${form.programId}"></script>`}
                </Box>
                <Box
                  component="pre"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "#0B0B0C",
                    color: "#E7E5DE",
                    fontSize: 13,
                    overflowX: "auto",
                    mb: 0,
                  }}
                >
                  {`Commission.initiateSaleCheckout()\n  .then((result) => { window.location.href = result.authorizationUrl; })\n  .catch((err) => { /* show err.message to the customer */ });`}
                </Box>
              </>
            ) : (
              <Typography variant="body2" sx={{ color: tokens.muted }}>
                Add your website URL on the Account page before this campaign can go live - sale-goal campaigns
                require customers to check out on your own site.{" "}
                <Box component={Link} href="/dashboard/account" sx={{ color: tokens.ink, fontWeight: 600 }}>
                  Go to Account
                </Box>
              </Typography>
            )}
          </Paper>
        )}

        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button href="/dashboard/campaigns" color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" size="large" disabled={status.loading}>
            {status.loading ? "Saving…" : "Save changes"}
          </Button>
        </Stack>
      </Box>
    </>
  );
}