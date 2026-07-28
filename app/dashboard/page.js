import { Grid, Paper, Typography, Stack, Chip, Box } from "@mui/material";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { sampleOverview, sampleTransactions } from "@/lib/sampleData";
import { tokens } from "@/lib/theme";

// In production, replace sampleOverview with a Supabase query, e.g.:
//   const supabase = createServerSupabaseClient();
//   const { data: commissions } = await supabase
//     .from("commissions")
//     .select("affiliate_payout_naira, payout_status, enrollment_id")
//     .eq("enrollment_id", currentUserEnrollmentIds);
// then aggregate totals server-side before rendering.

export default function DashboardHome() {
  const o = sampleOverview;

  return (
    <>
      <PageHeader title="Home" subtitle="An overview of everything happening on your account." />

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={4}>
          <StatCard label="Total earnings" value={`₦${o.totalEarningsNaira.toLocaleString()}`} accent />
        </Grid>
        <Grid item xs={6} md={4}>
          <StatCard label="Pending payout" value={`₦${o.pendingPayoutNaira.toLocaleString()}`} hint="Clears on next payout run" />
        </Grid>
        <Grid item xs={6} md={4}>
          <StatCard label="Sales generated" value={o.totalSalesCount} hint="All time" />
        </Grid>
        <Grid item xs={6} md={4}>
          <StatCard label="Active referrals" value={o.activeReferrals} hint="Across your network" />
        </Grid>
        <Grid item xs={6} md={4}>
          <StatCard label="Products listed" value={o.productsListed} />
        </Grid>
        <Grid item xs={6} md={4}>
          <StatCard label="Programs running" value={o.programsRunning} />
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Recent activity
      </Typography>
      <Paper variant="outlined" sx={{ borderColor: tokens.border, borderRadius: 3, overflow: "hidden" }}>
        {sampleTransactions.map((t, i) => (
          <Box
            key={t.id}
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
              <Typography variant="body2" fontWeight={600}>
                {t.product}
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                {t.date} · Tier {t.tier} · {t.customer}
              </Typography>
            </Box>
            <Stack direction="row" spacing={3} alignItems="center">
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
                  Commission
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  ₦{t.commissionNaira.toLocaleString()}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={t.status}
                sx={{
                  textTransform: "capitalize",
                  bgcolor: t.status === "paid" ? "#E7F5EE" : "#FFF3C4",
                  color: t.status === "paid" ? tokens.success : tokens.brandInk,
                  fontWeight: 700,
                }}
              />
            </Stack>
          </Box>
        ))}
      </Paper>
    </>
  );
}
