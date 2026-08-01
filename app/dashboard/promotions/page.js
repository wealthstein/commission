"use client";

import { Paper, Box, Typography, Stack, IconButton, Tooltip } from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import PageHeader from "@/components/dashboard/PageHeader";
import { samplePromotions } from "@/lib/sampleData";
import { tokens } from "@/lib/theme";

// Production query: supabase.from("affiliate_enrollments").select("*, affiliate_programs(*, products(*))").eq("affiliate_id", myUserId)

export default function PromotionsPage() {
  function copyLink(code) {
    const url = `https://commission.ng/r/${code}`;
    navigator.clipboard?.writeText(url);
  }

  return (
    <>
      <PageHeader title="My Promotions" subtitle="Products you are promoting as an affiliate, and how each link is performing." />

      <Paper variant="outlined" sx={{ borderColor: tokens.border, borderRadius: 3, overflow: "hidden" }}>
        {samplePromotions.map((p, i) => (
          <Box
            key={p.id}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2.5,
              py: 2,
              borderTop: i === 0 ? "none" : `1px solid ${tokens.border}`,
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ minWidth: 200 }}>
              <Typography fontWeight={700}>{p.product}</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="caption" sx={{ color: tokens.muted }}>
                  commission.ng/r/{p.code}
                </Typography>
                <Tooltip title="Copy link">
                  <IconButton size="small" onClick={() => copyLink(p.code)}>
                    <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
            <Stack direction="row" spacing={3}>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
                  Clicks
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {p.clicks}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
                  Sales
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {p.sales}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
                  Earned
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  ₦{p.earnedNaira.toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          </Box>
        ))}
      </Paper>
    </>
  );
}
