"use client";

import { useState } from "react";
import { Box, Typography, Slider, Grid, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";
import { projectMonthlyEarnings } from "@/lib/earningsMath";

const POOL_NAIRA = 10000; // matches the worked example elsewhere on this page

export default function AffiliateEarningsCalculator() {
  const [ownConversions, setOwnConversions] = useState(5);
  const [referredAffiliateCount, setReferredAffiliateCount] = useState(2);
  const [avgPerReferred, setAvgPerReferred] = useState(3);
  const [subReferredAffiliateCount, setSubReferredAffiliateCount] = useState(4);
  const [avgPerSubReferred, setAvgPerSubReferred] = useState(2);

  const result = projectMonthlyEarnings({
    poolNaira: POOL_NAIRA,
    ownConversions,
    referredAffiliateCount,
    avgConversionsPerReferredAffiliate: avgPerReferred,
    subReferredAffiliateCount,
    avgConversionsPerSubReferredAffiliate: avgPerSubReferred,
  });

  return (
    <Box sx={{ border: `1px solid ${tokens.border}`, borderRadius: 3, p: { xs: 3, md: 4 } }}>
      <Typography variant="overline" sx={{ color: tokens.muted, letterSpacing: 1.2 }}>
        YOUR PROJECTED MONTHLY EARNINGS
      </Typography>
      <Typography variant="body2" sx={{ color: tokens.muted, mt: 1, mb: 3 }}>
        Based on a typical 10,000 naira commission pool per Intent Intent Qualified Lead (IQL) or sale, split 50% / 30% /
        20% across tiers.
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            <Box>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontWeight={600}>
                  Your own conversions / month
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {ownConversions}
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                Tier 1 - you earn 50% of the pool directly
              </Typography>
              <Slider value={ownConversions} onChange={(_, v) => setOwnConversions(v)} min={0} max={50} sx={{ color: tokens.brand, mt: 1 }} />
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontWeight={600}>
                  Affiliates you have referred
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {referredAffiliateCount}
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                Tier 2 - you earn 30% of every conversion they generate
              </Typography>
              <Slider value={referredAffiliateCount} onChange={(_, v) => setReferredAffiliateCount(v)} min={0} max={20} sx={{ color: "#FFE280", mt: 1 }} />
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontWeight={600}>
                  Their average conversions / month
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {avgPerReferred}
                </Typography>
              </Stack>
              <Slider value={avgPerReferred} onChange={(_, v) => setAvgPerReferred(v)} min={0} max={20} sx={{ color: "#FFE280", mt: 1 }} />
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontWeight={600}>
                  Affiliates referred by your affiliates
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {subReferredAffiliateCount}
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                Tier 3 - you earn 20% of every conversion they generate
              </Typography>
              <Slider value={subReferredAffiliateCount} onChange={(_, v) => setSubReferredAffiliateCount(v)} min={0} max={40} sx={{ color: "#FFF3C4", mt: 1 }} />
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontWeight={600}>
                  Their average conversions / month
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {avgPerSubReferred}
                </Typography>
              </Stack>
              <Slider value={avgPerSubReferred} onChange={(_, v) => setAvgPerSubReferred(v)} min={0} max={20} sx={{ color: "#FFF3C4", mt: 1 }} />
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Stack spacing={1.5} sx={{ height: "100%", justifyContent: "center" }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#F7F6F2" }}>
              <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
                Tier 1 (direct)
              </Typography>
              <Typography fontWeight={700}>₦{result.tier1Naira.toLocaleString()}</Typography>
            </Box>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#F7F6F2" }}>
              <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
                Tier 2 (referred affiliates)
              </Typography>
              <Typography fontWeight={700}>₦{result.tier2Naira.toLocaleString()}</Typography>
            </Box>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#F7F6F2" }}>
              <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
                Tier 3 (their affiliates)
              </Typography>
              <Typography fontWeight={700}>₦{result.tier3Naira.toLocaleString()}</Typography>
            </Box>
            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: tokens.brand, textAlign: "center" }}>
              <Typography variant="caption" sx={{ color: tokens.brandInk, display: "block" }}>
                Estimated total / month
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: tokens.brandInk }}>
                ₦{result.totalNaira.toLocaleString()}
              </Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>

      <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mt: 3 }}>
        Illustrative only, using a typical 10,000 naira pool - the real amount is set by each business per campaign
        and can be smaller or larger.
      </Typography>
    </Box>
  );
}
