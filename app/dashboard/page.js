"use client";

import { useEffect, useState } from "react";
import { Grid, Paper, Typography, Stack, Chip, Box, CircularProgress } from "@mui/material";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { sampleOverview } from "@/lib/sampleData";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) {
        setLoading(false);
        return;
      }
      const { data: userRow } = await supabase.from("core_users").select("id").eq("auth_user_id", authUser.id).single();
      if (!userRow) {
        setLoading(false);
        return;
      }

      // Affiliate side - every commission tied to any of this user's own enrollments.
      const { data: enrollments } = await supabase.from("affiliate_enrollments").select("id").eq("affiliate_id", userRow.id);
      const enrollmentIds = (enrollments || []).map((e) => e.id);

      let commissions = [];
      if (enrollmentIds.length > 0) {
        const { data } = await supabase
          .from("billing_commissions")
          .select("affiliate_payout_naira, payout_status, created_at, affiliate_enrollments(affiliate_programs(affiliate_campaigns(name)))")
          .in("enrollment_id", enrollmentIds)
          .order("created_at", { ascending: false });
        commissions = data || [];
      }

      const totalEarningsNaira = commissions.reduce((sum, c) => sum + Number(c.affiliate_payout_naira), 0);
      const pendingPayoutNaira = commissions
        .filter((c) => c.payout_status === "pending")
        .reduce((sum, c) => sum + Number(c.affiliate_payout_naira), 0);
      const totalSalesCount = commissions.length;

      // Business side - campaigns and active programs owned by this user's business, if any.
      const { data: business } = await supabase.from("core_businesses").select("id").eq("owner_id", userRow.id).maybeSingle();
      let campaignsListed = 0;
      let programsRunning = 0;
      if (business) {
        const { count: campaignCount } = await supabase
          .from("affiliate_campaigns")
          .select("id", { count: "exact", head: true })
          .eq("business_id", business.id);
        campaignsListed = campaignCount || 0;

        const { count: programCount } = await supabase
          .from("affiliate_programs")
          .select("id, affiliate_campaigns!inner(business_id)", { count: "exact", head: true })
          .eq("products.business_id", business.id)
          .eq("status", "active");
        programsRunning = programCount || 0;
      }

      // Active referrals - total size of my downline across all 3 tiers,
      // walked via referrer_enrollment_id (confirmed column, see
      // supabase/schema.sql), same logic as My Promotions -> Network.
      const { data: myEnrollmentsForNetwork } = await supabase
        .from("affiliate_enrollments")
        .select("id")
        .eq("affiliate_id", userRow.id);
      let frontier = (myEnrollmentsForNetwork || []).map((e) => e.id);
      let activeReferrals = 0;
      for (let tier = 1; tier <= 3 && frontier.length > 0; tier++) {
        const { data: next } = await supabase
          .from("affiliate_enrollments")
          .select("id")
          .in("referrer_enrollment_id", frontier);
        activeReferrals += (next || []).length;
        frontier = (next || []).map((e) => e.id);
      }

      setStats({
        totalEarningsNaira,
        pendingPayoutNaira,
        totalSalesCount,
        activeReferrals,
        campaignsListed,
        programsRunning,
      });
      setRecent(commissions.slice(0, 8));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const o = stats || sampleOverview;

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
          <StatCard label="Campaigns listed" value={o.campaignsListed} />
        </Grid>
        <Grid item xs={6} md={4}>
          <StatCard label="Programs running" value={o.programsRunning} />
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Recent activity
      </Typography>
      <Paper variant="outlined" sx={{ borderColor: tokens.border, borderRadius: 3, overflow: "hidden" }}>
        {recent.length === 0 && (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography sx={{ color: tokens.muted }}>Nothing yet - activity shows up here once a campaign starts converting.</Typography>
          </Box>
        )}
        {recent.map((c, i) => (
          <Box
            key={i}
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
                {c.affiliate_enrollments?.affiliate_programs?.campaigns?.name || "Campaign"}
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                {new Date(c.created_at).toLocaleDateString()}
              </Typography>
            </Box>
            <Stack direction="row" spacing={3} alignItems="center">
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
                  Commission
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  ₦{Number(c.affiliate_payout_naira).toLocaleString()}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={c.payout_status}
                sx={{
                  textTransform: "capitalize",
                  bgcolor: c.payout_status === "paid" ? "#E7F5EE" : "#FFF3C4",
                  color: c.payout_status === "paid" ? tokens.success : tokens.brandInk,
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
