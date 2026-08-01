"use client";

import { useState } from "react";
import { Box, Typography, Slider, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";

// Illustrative benchmarks used only to make the slider feel concrete - a
// business or affiliate sets their own real numbers once they are live.
const TYPICAL_AD_COST_PER_LEAD_NAIRA = 8000; // rough Google/Meta ads CPL benchmark for comparison
const AVERAGE_PPQL_NAIRA = 2500; // blended across industries, see lib/industryPages.js
const AVERAGE_AFFILIATE_SHARE_PERCENT = 70; // typical tier-1 share of a qualified lead fee

const BUSINESS_MAX_NAIRA = 10000000;
const BUSINESS_MIN_NAIRA = 100000;
const BUSINESS_STEP_NAIRA = 50000;

const AFFILIATE_MAX_NAIRA = 1000000;
const AFFILIATE_MIN_NAIRA = 10000;
const AFFILIATE_STEP_NAIRA = 10000;

export default function SavingsCalculator({ audience }) {
  const isBusiness = audience === "business";
  const [budget, setBudget] = useState(1000000);
  const [referralValue, setReferralValue] = useState(150000);

  const value = isBusiness ? budget : referralValue;

  const leadsViaCommission = Math.floor(budget / AVERAGE_PPQL_NAIRA);
  const leadsViaAds = Math.floor(budget / TYPICAL_AD_COST_PER_LEAD_NAIRA);
  const extraLeads = Math.max(0, leadsViaCommission - leadsViaAds);

  const earningsNaira = Math.round(referralValue * (AVERAGE_AFFILIATE_SHARE_PERCENT / 100));

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 440,
        border: `1px solid ${tokens.border}`,
        borderRadius: 4,
        p: 3,
        bgcolor: tokens.paper,
        boxShadow: "0 24px 48px -24px rgba(11,11,12,0.18)",
      }}
    >
      <Typography variant="overline" sx={{ color: tokens.muted, letterSpacing: 1.2 }}>
        {isBusiness ? "See what your budget could do" : "See what you could earn"}
      </Typography>

      <Typography variant="body2" sx={{ color: tokens.muted, mt: 1, mb: 3 }}>
        {isBusiness
          ? "Drag to set your monthly marketing budget."
          : "Drag to set the value of leads or sales you could realistically refer per month."}
      </Typography>

      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: tokens.muted }}>
          {isBusiness ? "Monthly budget" : "Referral value / month"}
        </Typography>
        <Typography variant="caption" fontWeight={700}>
          ₦{value.toLocaleString()}
        </Typography>
      </Stack>
      <Slider
        value={value}
        onChange={(_, v) => (isBusiness ? setBudget(v) : setReferralValue(v))}
        min={isBusiness ? BUSINESS_MIN_NAIRA : AFFILIATE_MIN_NAIRA}
        max={isBusiness ? BUSINESS_MAX_NAIRA : AFFILIATE_MAX_NAIRA}
        step={isBusiness ? BUSINESS_STEP_NAIRA : AFFILIATE_STEP_NAIRA}
        sx={{ color: tokens.brand, mb: 3 }}
      />

      {isBusiness ? (
        <Stack spacing={1.5}>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#F1EFE7" }}>
            <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
              Leads that budget buys via typical ads
            </Typography>
            <Typography fontWeight={700}>{leadsViaAds.toLocaleString()} leads</Typography>
          </Box>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: tokens.brand }}>
            <Typography variant="caption" sx={{ color: tokens.brandInk, display: "block" }}>
              Leads that budget buys on Commission
            </Typography>
            <Typography fontWeight={700} sx={{ color: tokens.brandInk }}>
              {leadsViaCommission.toLocaleString()} leads
            </Typography>
          </Box>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#E7F5EE", textAlign: "center" }}>
            <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
              Extra leads for the same budget
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: tokens.success }}>
              +{extraLeads.toLocaleString()} leads
            </Typography>
          </Box>
        </Stack>
      ) : (
        <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "#F1EFE7", textAlign: "center" }}>
          <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
            Estimated monthly earnings
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            ₦{earningsNaira.toLocaleString()}
          </Typography>
        </Box>
      )}

      <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mt: 2 }}>
        Illustrative only, based on typical figures across industries - your real numbers depend on the campaigns
        you choose.
      </Typography>
    </Box>
  );
}
