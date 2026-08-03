"use client";

import { useState } from "react";
import { Paper, Box, Typography, Stack, IconButton, Tooltip, Tabs, Tab, Chip } from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import PageHeader from "@/components/dashboard/PageHeader";
import { samplePromotions, sampleNetwork } from "@/lib/sampleData";
import { tokens } from "@/lib/theme";

// Production queries:
//   Promoting tab: supabase.from("affiliate_enrollments").select("*, affiliate_programs(*, products(*))").eq("affiliate_id", myUserId)
//   Network tab: recursively walk affiliate_enrollments where referrer_enrollment_id
//     chains back to the current user's enrollments, up to 3 tiers deep.

const TIER_COLORS = {
  1: { bg: tokens.brand, fg: tokens.brandInk },
  2: { bg: "#FFE280", fg: tokens.brandInk },
  3: { bg: "#FFF3C4", fg: tokens.brandInk },
};

function PromotingTab() {
  function copyLink(code) {
    const url = `https://commission.ng/r/${code}`;
    navigator.clipboard?.writeText(url);
  }

  return (
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
  );
}

function NetworkTab() {
  return (
    <Paper variant="outlined" sx={{ borderColor: tokens.border, borderRadius: 3, overflow: "hidden" }}>
      {sampleNetwork.map((n, i) => {
        const c = TIER_COLORS[n.tier];
        return (
          <Box
            key={n.id}
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
            <Box sx={{ minWidth: 180 }}>
              <Typography fontWeight={700}>{n.name}</Typography>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                Joined {n.joined}
              </Typography>
            </Box>
            <Stack direction="row" spacing={3} alignItems="center">
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
                  Sales generated
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {n.salesGenerated}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
                  Earned from them
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  ₦{n.earningsFromThemNaira.toLocaleString()}
                </Typography>
              </Box>
              <Chip label={`Tier ${n.tier}`} size="small" sx={{ bgcolor: c.bg, color: c.fg, fontWeight: 700 }} />
            </Stack>
          </Box>
        );
      })}
    </Paper>
  );
}

export default function PromotionsPage() {
  const [tab, setTab] = useState(0);

  return (
    <>
      <PageHeader title="My Promotions" subtitle="What you're promoting as an affiliate, and who you've brought into your network." />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: `1px solid ${tokens.border}` }}>
        <Tab label="Promoting" sx={{ textTransform: "none", fontWeight: 600 }} />
        <Tab label="Network" sx={{ textTransform: "none", fontWeight: 600 }} />
      </Tabs>

      {tab === 0 ? <PromotingTab /> : <NetworkTab />}
    </>
  );
}
