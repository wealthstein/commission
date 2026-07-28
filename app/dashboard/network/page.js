import { Paper, Box, Typography, Chip, Stack } from "@mui/material";
import PageHeader from "@/components/dashboard/PageHeader";
import { sampleNetwork } from "@/lib/sampleData";
import { tokens } from "@/lib/theme";

// Production query: recursively walk affiliate_enrollments where referrer_enrollment_id
// chains back to the current user's enrollments, up to 3 tiers deep.

const TIER_COLORS = {
  1: { bg: tokens.brand, fg: tokens.brandInk },
  2: { bg: "#FFE280", fg: tokens.brandInk },
  3: { bg: "#FFF3C4", fg: tokens.brandInk },
};

export default function NetworkPage() {
  return (
    <>
      <PageHeader title="Network" subtitle="Affiliates you've referred into programs, and your 3-tier downline." />

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
                    You've earned from them
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
    </>
  );
}
