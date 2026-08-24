"use client";

import { useState } from "react";
import { Box, Typography, ToggleButtonGroup, ToggleButton, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";
import { pricingPlans } from "@/lib/pricingPlans";

// commission (8% + 5% + 2%, matching the TRD's worked example). Only the
// INNER split of that ₦15,000 commission changes with plan — how much
// Commission keeps vs. how much reaches affiliates. The business's own
// proceeds (₦85,000) never move, because Commission's fee always comes
// out of the affiliate commission, never the sale.
const SALE_NAIRA = 100000;
const COMMISSION_NAIRA = 15000;

export default function BusinessSettlementVisual() {
  const [planId, setPlanId] = useState("pro");
  const plan = pricingPlans.find((p) => p.id === planId);

  const feeNaira = Math.round((COMMISSION_NAIRA * plan.feePercent) / 100);
  const affiliatesNaira = COMMISSION_NAIRA - feeNaira;
  const affiliatePct = (affiliatesNaira / COMMISSION_NAIRA) * 100;

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
        Your fee shrinks as you grow
      </Typography>

      <ToggleButtonGroup
        value={planId}
        exclusive
        size="small"
        onChange={(_, v) => v && setPlanId(v)}
        sx={{
          my: 2,
          bgcolor: "#F7F6F2",
          borderRadius: 999,
          p: 0.4,
          width: "100%",
          "& .MuiToggleButton-root": {
            flex: 1,
            border: "none",
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 700,
            fontSize: 13,
            color: tokens.muted,
          },
          "& .Mui-selected": { bgcolor: `${tokens.paper} !important`, color: `${tokens.ink} !important` },
        }}
      >
        {pricingPlans.map((p) => (
          <ToggleButton key={p.id} value={p.id}>
            {p.name}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Typography variant="body2" sx={{ color: tokens.muted, mb: 0.5 }}>
        On a ₦{SALE_NAIRA.toLocaleString()} sale with a 15% affiliate commission (₦{COMMISSION_NAIRA.toLocaleString()}):
      </Typography>

      {/* Stacked bar representing ONLY the ₦15,000 commission splitting between affiliates and Commission's fee */}
      <Box sx={{ height: 40, borderRadius: 2, overflow: "hidden", display: "flex", mt: 2, mb: 1.5 }}>
        <Box
          sx={{
            width: `${affiliatePct}%`,
            bgcolor: tokens.brand,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "width 480ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Typography variant="caption" sx={{ color: tokens.brandInk, fontWeight: 700, whiteSpace: "nowrap" }}>
            {affiliatePct >= 22 ? `Affiliates ₦${affiliatesNaira.toLocaleString()}` : ""}
          </Typography>
        </Box>
        <Box
          sx={{
            width: `${100 - affiliatePct}%`,
            bgcolor: tokens.ink,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "width 480ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Typography variant="caption" sx={{ color: "#fff", fontWeight: 700, whiteSpace: "nowrap" }}>
            {100 - affiliatePct >= 14 ? `Fee ₦${feeNaira.toLocaleString()}` : ""}
          </Typography>
        </Box>
      </Box>

      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ color: tokens.muted }}>
          <Box component="span" sx={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", bgcolor: tokens.brand, mr: 0.75 }} />
          Reaches your affiliates
        </Typography>
        <Typography variant="caption" sx={{ color: tokens.muted }}>
          <Box component="span" sx={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", bgcolor: tokens.ink, mr: 0.75 }} />
          Commission fee
        </Typography>
      </Stack>

      <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#F7F6F2" }}>
        <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
          Your proceeds — unaffected by plan
        </Typography>
        <Typography variant="h6" fontWeight={700}>
          ₦{(SALE_NAIRA - COMMISSION_NAIRA).toLocaleString()}
        </Typography>
      </Box>

      <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mt: 2 }}>
        Upgrading does not change what you receive — it means more of your commission reaches affiliates, making your
        program more attractive to top performers.
      </Typography>
    </Box>
  );
}
