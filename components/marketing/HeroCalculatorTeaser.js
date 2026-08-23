"use client";

import { useState } from "react";
import Link from "next/link";
import { Box, Typography, Slider, Stack, Button } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import { DEFAULT_PPQL_NAIRA } from "@/lib/industryPages";

const AVERAGE_AD_CPL_NAIRA = 8000; // blended illustrative benchmark - the full calculator lets a business pick a specific real alternative instead
const AVERAGE_AFFILIATE_SHARE_PERCENT = 50; // matches the default tier-1 share used on the full calculator page

const BUSINESS_MAX_NAIRA = 10000000;
const BUSINESS_MIN_NAIRA = 100000;

const AFFILIATE_MAX_NAIRA = 1000000;
const AFFILIATE_MIN_NAIRA = 10000;

/**
 * Compact version of the calculator for the Hero card slot - one slider,
 * one headline result, then a link to the full detailed calculator page
 * (/calculator), which has the real depth: pick-your-alternative,
 * pick-your-industry, tier breakdowns, worked examples. This card is
 * intentionally lightweight so it does not crowd the Hero layout.
 */
export default function HeroCalculatorTeaser({ audience }) {
  const isBusiness = audience === "business";
  const [value, setValue] = useState(isBusiness ? 1000000 : 150000);

  const leadsViaCommission = Math.floor(value / DEFAULT_PPQL_NAIRA);
  const leadsViaAds = Math.floor(value / AVERAGE_AD_CPL_NAIRA);
  const extraLeads = Math.max(0, leadsViaCommission - leadsViaAds);
  const earningsNaira = Math.round(value * (AVERAGE_AFFILIATE_SHARE_PERCENT / 100));

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
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Typography variant="overline" sx={{ color: tokens.muted, letterSpacing: 1.2 }}>
        {isBusiness ? "See what your budget could do" : "See what you could earn"}
      </Typography>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: tokens.muted }}>
          {isBusiness ? "Monthly budget" : "Referral value / month"}
        </Typography>
        <Typography variant="caption" fontWeight={700}>
          ₦{value.toLocaleString()}
        </Typography>
      </Stack>
      <Slider
        value={value}
        onChange={(_, v) => setValue(v)}
        min={isBusiness ? BUSINESS_MIN_NAIRA : AFFILIATE_MIN_NAIRA}
        max={isBusiness ? BUSINESS_MAX_NAIRA : AFFILIATE_MAX_NAIRA}
        sx={{ color: tokens.brand, mb: 2.5 }}
      />

      <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: isBusiness ? "#E7F5EE" : "#F7F6F2", textAlign: "center", mb: 2.5 }}>
        <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
          {isBusiness ? "Extra leads for the same budget" : "Estimated monthly earnings"}
        </Typography>
        <Typography variant="h5" fontWeight={700} sx={{ color: isBusiness ? tokens.success : tokens.ink }}>
          {isBusiness ? `+${extraLeads.toLocaleString()} leads` : `₦${earningsNaira.toLocaleString()}`}
        </Typography>
      </Box>

      <Button
        component={Link}
        href={urls.calculator(audience)}
        endIcon={<ArrowForwardRoundedIcon />}
        fullWidth
        variant="outlined"
      >
        See the full breakdown
      </Button>
    </Box>
  );
}