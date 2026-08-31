"use client";

import { useState } from "react";
import { Box, Typography, Slider, Stack, MenuItem, Select, FormControl, InputLabel, Grid, ToggleButtonGroup, ToggleButton } from "@mui/material";
import Link from "next/link";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import { comparisons } from "@/lib/comparisons";
import { industryPages, DEFAULT_PPQL_NAIRA } from "@/lib/industryPages";
import { pricingPlans, feePercentForPlan } from "@/lib/pricingPlans";

// here (not in lib/comparisons.js) since that file holds qualitative
// comparison copy, not numeric assumptions. A business sets its own real
// numbers once live; this is only meant to make the slider feel concrete.
const ALTERNATIVE_CPL_NAIRA = {
  "google-ads": 8000,
  "facebook-ads": 6000,
  "cold-emails": 3000,
  "seo-agencies": 5000,
  "influencer-marketing": 12000,
  "tiktok-ads": 7000,
};

const BUDGET_MIN_NAIRA = 100000;
const BUDGET_MAX_NAIRA = 10000000;
const BUDGET_STEP_NAIRA = 50000;

export default function SavingsCalculator() {
  const [budget, setBudget] = useState(1000000);
  const [comparisonSlug, setComparisonSlug] = useState(comparisons[0]?.slug || "google-ads");
  const [industrySlug, setIndustrySlug] = useState(industryPages[0]?.slug || "");
  const [plan, setPlan] = useState("pro"); // 'pro' = Medium, matches the highlighted plan elsewhere on the site

  const comparison = comparisons.find((c) => c.slug === comparisonSlug) || comparisons[0];
  const industry = industryPages.find((i) => i.slug === industrySlug);
  const industryPpql = industry?.ppqlNaira || DEFAULT_PPQL_NAIRA;
  const alternativeCpl = ALTERNATIVE_CPL_NAIRA[comparisonSlug] || 8000;

  // Honest math: on a Lead-goal campaign, Commission's fee is taken the
  // moment a business tops up their wallet - what actually funds leads is
  // the NET amount after that fee, not the raw budget typed in. Comparing
  // the raw budget against Commission's per-lead cost would overstate how
  // many leads it buys.
  const feePercent = feePercentForPlan(plan);
  const netCampaignBudget = Math.round(budget * (1 - feePercent / 100));
  const platformFeeNaira = budget - netCampaignBudget;

  const leadsViaCommission = Math.floor(netCampaignBudget / industryPpql);
  const leadsViaAlternative = Math.floor(budget / alternativeCpl);
  const extraLeads = Math.max(0, leadsViaCommission - leadsViaAlternative);
  const savingsNaira = extraLeads * alternativeCpl;

  const reasons = (comparison?.points || []).slice(0, 3);

  return (
    <Box sx={{ border: `1px solid ${tokens.border}`, borderRadius: 4, p: { xs: 3, md: 4 }, maxWidth: 720, mx: "auto" }}>
      <Typography variant="overline" sx={{ color: tokens.muted, letterSpacing: 1.2 }}>
        SEE WHAT YOUR BUDGET COULD DO
      </Typography>
      <Typography variant="body2" sx={{ color: tokens.muted, mt: 1, mb: 3 }}>
        Pick what you would otherwise spend on, and your industry, to see a real comparison - not a generic guess.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Compare against</InputLabel>
            <Select label="Compare against" value={comparisonSlug} onChange={(e) => setComparisonSlug(e.target.value)}>
              {comparisons.map((c) => (
                <MenuItem key={c.slug} value={c.slug}>
                  {c.channelName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Your industry</InputLabel>
            <Select label="Your industry" value={industrySlug} onChange={(e) => setIndustrySlug(e.target.value)}>
              {industryPages.map((i) => (
                <MenuItem key={i.slug} value={i.slug}>
                  {i.industryName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: tokens.muted }}>
          Monthly budget
        </Typography>
        <Typography variant="caption" fontWeight={700}>
          ₦{budget.toLocaleString()}
        </Typography>
      </Stack>
      <Slider
        value={budget}
        onChange={(_, v) => setBudget(v)}
        min={BUDGET_MIN_NAIRA}
        max={BUDGET_MAX_NAIRA}
        step={BUDGET_STEP_NAIRA}
        sx={{ color: tokens.brand, mb: 3 }}
      />

      <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mb: 1 }}>
        Your plan
      </Typography>
      <ToggleButtonGroup
        value={plan}
        exclusive
        size="small"
        onChange={(_, v) => v && setPlan(v)}
        sx={{
          mb: 2,
          width: "100%",
          "& .MuiToggleButton-root": { flex: 1, textTransform: "none", fontWeight: 600 },
        }}
      >
        {pricingPlans.map((p) => (
          <ToggleButton key={p.id} value={p.id}>
            {p.name} · {p.feePercent}% fee
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#F7F6F2", mb: 3 }}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: tokens.muted }}>
            ₦{budget.toLocaleString()} top-up
          </Typography>
          <Typography variant="caption" sx={{ color: tokens.muted }}>
            − ₦{platformFeeNaira.toLocaleString()} platform fee ({feePercent}%)
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
          <Typography variant="body2" fontWeight={700}>
            = ₦{netCampaignBudget.toLocaleString()} actual campaign budget
          </Typography>
        </Stack>
      </Box>

      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#F7F6F2" }}>
            <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
              Via {comparison?.channelName}
            </Typography>
            <Typography fontWeight={700}>{leadsViaAlternative.toLocaleString()} Leads</Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: tokens.brand }}>
            <Typography variant="caption" sx={{ color: tokens.brandInk, display: "block" }}>
              Via Commission
            </Typography>
            <Typography fontWeight={700} sx={{ color: tokens.brandInk }}>
              {leadsViaCommission.toLocaleString()} Intent Qualified Leads
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "#E7F5EE", textAlign: "center", mb: 3 }}>
        <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
          {extraLeads > 0 ? "Extra Intent Qualified Leads, same budget - equivalent to" : "Estimated equivalent value"}
        </Typography>
        <Typography variant="h5" fontWeight={700} sx={{ color: tokens.success }}>
          {extraLeads > 0 ? `+${extraLeads.toLocaleString()} Intent Qualified Leads · ₦${savingsNaira.toLocaleString()} saved` : "Comparable cost in this industry"}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5 }}>
          Same ₦{budget.toLocaleString()} top-up, by plan
        </Typography>
        <Grid container spacing={1}>
          {pricingPlans.map((p) => {
            const planNet = Math.round(budget * (1 - p.feePercent / 100));
            const planLeads = Math.floor(planNet / industryPpql);
            const isSelected = p.id === plan;
            return (
              <Grid item xs={4} key={p.id}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    textAlign: "center",
                    border: `1px solid ${isSelected ? tokens.ink : tokens.border}`,
                    bgcolor: isSelected ? tokens.paper : "transparent",
                  }}
                >
                  <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
                    {p.name}
                  </Typography>
                  <Typography fontWeight={700}>{planLeads.toLocaleString()}</Typography>
                  <Typography variant="caption" sx={{ color: tokens.muted }}>
                    leads
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
        <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mt: 1 }}>
          Upgrading does not cost more per lead - it just leaves more of the same top-up as actual campaign budget.
        </Typography>
      </Box>

      {reasons.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5 }}>
            Why Commission beats {comparison?.channelName}
          </Typography>
          <Stack spacing={1}>
            {reasons.map((r) => (
              <Typography key={r.title} variant="body2" sx={{ color: tokens.muted }}>
                <Box component="span" sx={{ fontWeight: 700, color: tokens.ink }}>
                  {r.title}.{" "}
                </Box>
                {r.body}
              </Typography>
            ))}
          </Stack>
          <Typography
            component={Link}
            href={urls.comparison(comparison.slug)}
            variant="caption"
            sx={{ color: tokens.ink, fontWeight: 600, display: "inline-block", mt: 1 }}
          >
            See the full comparison →
          </Typography>
        </Box>
      )}

    </Box>
  );
}
