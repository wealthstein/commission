"use client";

import { useEffect, useState } from "react";
import { Paper, Box, Typography, Stack, IconButton, Tooltip, Tabs, Tab, Chip, CircularProgress, Alert } from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";

const TIER_COLORS = {
  1: { bg: tokens.brand, fg: tokens.brandInk },
  2: { bg: "#FFE280", fg: tokens.brandInk },
  3: { bg: "#FFF3C4", fg: tokens.brandInk },
};

function PromotingTab({ userRowId }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!userRowId) {
      setLoading(false);
      return;
    }
    const supabase = createClient();

    async function load() {
      const { data: enrollments } = await supabase
        .from("affiliate_enrollments")
        .select("id, program_id, affiliate_programs(id, products(name))")
        .eq("affiliate_id", userRowId);

      const enrollmentIds = (enrollments || []).map((e) => e.id);
      let commissionsByEnrollment = {};
      if (enrollmentIds.length > 0) {
        const { data: commissions } = await supabase
          .from("commissions")
          .select("enrollment_id, affiliate_payout_naira")
          .in("enrollment_id", enrollmentIds);
        commissionsByEnrollment = (commissions || []).reduce((acc, c) => {
          if (!acc[c.enrollment_id]) acc[c.enrollment_id] = { count: 0, total: 0 };
          acc[c.enrollment_id].count += 1;
          acc[c.enrollment_id].total += Number(c.affiliate_payout_naira);
          return acc;
        }, {});
      }

      setRows(
        (enrollments || []).map((e) => ({
          id: e.id,
          product: e.affiliate_programs?.products?.name || "Campaign",
          sales: commissionsByEnrollment[e.id]?.count || 0,
          earnedNaira: commissionsByEnrollment[e.id]?.total || 0,
        }))
      );
      setLoading(false);
    }
    load();
  }, [userRowId]);

  function copyLink(enrollmentId) {
    const url = `https://www.commission.ng/r/${enrollmentId}`;
    navigator.clipboard?.writeText(url);
  }

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper variant="outlined" sx={{ borderColor: tokens.border, borderRadius: 3, overflow: "hidden" }}>
      {rows.map((p, i) => (
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
                commission.ng/r/{p.id.slice(0, 8)}
              </Typography>
              <Tooltip title="Copy link">
                <IconButton size="small" onClick={() => copyLink(p.id)}>
                  <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
          <Stack direction="row" spacing={3}>
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
      {rows.length === 0 && (
        <Box sx={{ p: 5, textAlign: "center" }}>
          <Typography sx={{ color: tokens.muted }}>
            You haven&apos;t joined a program yet - browse Discover to find one.
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

function RealEstateSalesTab({ userRowId }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!userRowId) {
      setLoading(false);
      return;
    }
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("manual_sale_confirmations")
        .select("id, reported_sale_amount_naira, reported_commission_naira, notes, created_at, leads(whatsapp_ref, affiliate_programs(products(name)))")
        .eq("affiliate_id", userRowId)
        .order("created_at", { ascending: false });

      setRows(data || []);
      setLoading(false);
    }
    load();
  }, [userRowId]);

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        These are sales the business confirmed closed off-platform - the client paid the business directly, and the
        business paid you directly. Commission does not process or hold this money; this is a record only.
      </Alert>
      <Paper variant="outlined" sx={{ borderColor: tokens.border, borderRadius: 3, overflow: "hidden" }}>
        {rows.map((r, i) => (
          <Box
            key={r.id}
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
              <Typography fontWeight={700}>{r.leads?.affiliate_programs?.products?.name || "Campaign"}</Typography>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                {r.leads?.whatsapp_ref} · Confirmed {new Date(r.created_at).toLocaleDateString()}
                {r.notes ? ` · ${r.notes}` : ""}
              </Typography>
            </Box>
            <Stack direction="row" spacing={3}>
              {r.reported_sale_amount_naira && (
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
                    Sale amount
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    ₦{Number(r.reported_sale_amount_naira).toLocaleString()}
                  </Typography>
                </Box>
              )}
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
                  Commission paid to you
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  ₦{Number(r.reported_commission_naira).toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          </Box>
        ))}
        {rows.length === 0 && (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography sx={{ color: tokens.muted }}>
              No confirmed real estate sales yet - this fills in once a business you referred a client to confirms
              a closed deal.
            </Typography>
          </Box>
        )}
      </Paper>
    </>
  );
}

function NetworkTab({ userRowId }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!userRowId) {
      setLoading(false);
      return;
    }
    const supabase = createClient();

    async function load() {
      // My own enrollments - the root of my referral tree.
      const { data: myEnrollments } = await supabase.from("affiliate_enrollments").select("id").eq("affiliate_id", userRowId);
      let frontier = (myEnrollments || []).map((e) => e.id);
      const downline = []; // { enrollmentId, tier (relative to ME, 1-3) }

      // Walk up to 3 levels down from my own enrollments via
      // referrer_enrollment_id - confirmed column, see supabase/schema.sql.
      for (let tier = 1; tier <= 3 && frontier.length > 0; tier++) {
        const { data: next } = await supabase
          .from("affiliate_enrollments")
          .select("id, affiliate_id, program_id, created_at, users(full_name, email)")
          .in("referrer_enrollment_id", frontier);
        (next || []).forEach((e) => downline.push({ ...e, tierRelativeToMe: tier }));
        frontier = (next || []).map((e) => e.id);
      }

      const downlineEnrollmentIds = downline.map((e) => e.id);
      let commissionsByEnrollment = {};
      if (downlineEnrollmentIds.length > 0) {
        const { data: commissions } = await supabase
          .from("commissions")
          .select("enrollment_id, affiliate_payout_naira")
          .in("enrollment_id", downlineEnrollmentIds);
        commissionsByEnrollment = (commissions || []).reduce((acc, c) => {
          if (!acc[c.enrollment_id]) acc[c.enrollment_id] = { count: 0 };
          acc[c.enrollment_id].count += 1;
          return acc;
        }, {});
      }

      // "Earned from them" - MY OWN commission rows, matched to the same
      // program each downline member is enrolled in. This is an
      // approximation: it shows my total earnings in that shared program,
      // not a precise per-referral attribution - the exact column linking
      // sibling commission rows back to one shared conversion event was
      // never confirmed, so this does not claim more precision than it has.
      const myEnrollmentIds = (myEnrollments || []).map((e) => e.id);
      const { data: myCommissions } = await supabase
        .from("commissions")
        .select("affiliate_payout_naira, affiliate_enrollments(program_id)")
        .in("enrollment_id", myEnrollmentIds);
      const myEarningsByProgram = (myCommissions || []).reduce((acc, c) => {
        const programId = c.affiliate_enrollments?.program_id;
        if (!programId) return acc;
        acc[programId] = (acc[programId] || 0) + Number(c.affiliate_payout_naira);
        return acc;
      }, {});

      setRows(
        downline.map((e) => ({
          id: e.id,
          name: e.users?.full_name || e.users?.email || "Affiliate",
          joined: new Date(e.created_at).toLocaleDateString(),
          tier: e.tierRelativeToMe,
          salesGenerated: commissionsByEnrollment[e.id]?.count || 0,
          earningsFromThemNaira: myEarningsByProgram[e.program_id] || 0,
        }))
      );
      setLoading(false);
    }
    load();
  }, [userRowId]);

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper variant="outlined" sx={{ borderColor: tokens.border, borderRadius: 3, overflow: "hidden" }}>
      {rows.map((n, i) => {
        const c = TIER_COLORS[n.tier] || TIER_COLORS[3];
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
      {rows.length === 0 && (
        <Box sx={{ p: 5, textAlign: "center" }}>
          <Typography sx={{ color: tokens.muted }}>No one in your network yet - your link is ready whenever they join through it.</Typography>
        </Box>
      )}
    </Paper>
  );
}

export default function PromotionsPage() {
  const [tab, setTab] = useState(0);
  const [userRowId, setUserRowId] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return;
      const { data: userRow } = await supabase.from("users").select("id").eq("auth_user_id", authUser.id).single();
      setUserRowId(userRow?.id || null);
    });
  }, []);

  return (
    <>
      <PageHeader title="My Promotions" subtitle="What you're promoting as an affiliate, and who you've brought into your network." />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: `1px solid ${tokens.border}` }}>
        <Tab label="Promoting" sx={{ textTransform: "none", fontWeight: 600 }} />
        <Tab label="Network" sx={{ textTransform: "none", fontWeight: 600 }} />
        <Tab label="Real Estate Sales" sx={{ textTransform: "none", fontWeight: 600 }} />
      </Tabs>

      {tab === 0 && <PromotingTab userRowId={userRowId} />}
      {tab === 1 && <NetworkTab userRowId={userRowId} />}
      {tab === 2 && <RealEstateSalesTab userRowId={userRowId} />}
    </>
  );
}
