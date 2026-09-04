"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Box, Grid, Typography, Stack, Button, Avatar, Divider, CircularProgress, Alert } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";
import { resolveLandingBranding } from "@/lib/branding";
import SignUpButton from "@/components/marketing/SignUpButton";

function JoinProgramInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [business, setBusiness] = useState(null);
  const [product, setProduct] = useState(null);
  const [program, setProgram] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [joinState, setJoinState] = useState({ loading: false, error: null, success: false });

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: biz } = await supabase.from("core_businesses").select("*").eq("slug", params.businessSlug).maybeSingle();
      const { data: prod } = biz
        ? await supabase.from("affiliate_campaigns").select("*").eq("business_id", biz.id).eq("slug", params.productSlug).maybeSingle()
        : { data: null };
      const { data: prog } = prod
        ? await supabase.from("affiliate_programs").select("*").eq("campaign_id", prod.id).eq("status", "active").maybeSingle()
        : { data: null };

      if (!biz || !prod || !prog) {
        setNotFoundState(true);
        setLoading(false);
        return;
      }
      setBusiness(biz);
      setProduct(prod);
      setProgram(prog);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setAuthUser(user);

      if (user) {
        const { data: userRow } = await supabase.from("core_users").select("id").eq("auth_user_id", user.id).single();
        if (userRow) {
          const { data: existing } = await supabase
            .from("affiliate_enrollments")
            .select("id")
            .eq("affiliate_id", userRow.id)
            .eq("program_id", prog.id)
            .maybeSingle();
          setAlreadyJoined(!!existing);
        }
      }
      setLoading(false);
    }
    load();
  }, [params.businessSlug, params.productSlug]);

  async function handleJoin() {
    setJoinState({ loading: true, error: null, success: false });
    try {
      const res = await fetch("/api/enrollments/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId: program.id, referrerReferralCode: searchParams.get("ref") || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join");
      setJoinState({ loading: false, error: null, success: true });
    } catch (err) {
      setJoinState({ loading: false, error: err.message, success: false });
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notFoundState) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh", textAlign: "center", px: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
          This program isn&apos;t available
        </Typography>
        <Typography sx={{ color: tokens.muted, mb: 3 }}>It may have ended, or the link may be out of date.</Typography>
        <Button variant="contained" component={Link} href="/">
          Back to Commission
        </Button>
      </Box>
    );
  }

  const branding = resolveLandingBranding(business);
  const commissionLine = `${program.tier1_percent}% on every ${program.conversion_goal === "lead" ? "qualified lead" : "sale"}`;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
      <Grid container sx={{ minHeight: "100vh" }}>
        <Grid item xs={12} md={6} sx={{ bgcolor: "#FAFAF8", borderRight: { md: `1px solid ${tokens.border}` } }}>
          <Box sx={{ px: { xs: 4, md: "150px" }, py: { xs: 4, md: 8 } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 5 }}>
              <Box component={Link} href="/" sx={{ color: tokens.muted, display: "flex", alignItems: "center", mr: 0.5 }} aria-label="Back">
                <ArrowBackRoundedIcon fontSize="small" />
              </Box>
              {branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logoUrl} alt={business.name} style={{ height: 32, width: 32, borderRadius: 6, objectFit: "cover" }} />
              ) : (
                <Avatar sx={{ width: 32, height: 32, bgcolor: tokens.brand, color: tokens.ink, fontWeight: 700, fontSize: 14 }}>
                  {(business.name || "?").charAt(0).toUpperCase()}
                </Avatar>
              )}
              <Typography fontWeight={700}>{business.name}</Typography>
            </Stack>

            <Typography variant="body2" sx={{ color: tokens.muted, mb: 0.5 }}>
              Promote
            </Typography>
            <Typography variant="h3" fontWeight={800} sx={{ mb: 4, fontSize: { xs: 28, md: 36 } }}>
              {product.name}
            </Typography>

            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography fontWeight={700}>Commission</Typography>
              <Typography fontWeight={700}>{commissionLine}</Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 4 }}>
              <Typography fontWeight={700}>Price</Typography>
              <Typography fontWeight={700}>₦{Number(product.price_naira).toLocaleString()}</Typography>
            </Stack>

            {product.description && (
              <Typography variant="body2" sx={{ color: tokens.muted }}>
                {product.description}
              </Typography>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ px: { xs: 4, md: "150px" }, py: { xs: 4, md: 8 } }}>
            <Typography variant="overline" sx={{ color: tokens.muted, fontWeight: 700, display: "block", mb: 2, textAlign: "center" }}>
              Join {business.name}&apos;s affiliate program
            </Typography>

            {!authUser && (
              <Stack spacing={2} alignItems="center">
                <Typography variant="body2" sx={{ color: tokens.muted, textAlign: "center" }}>
                  Sign up as an affiliate to start promoting {product.name} and earning {commissionLine}.
                </Typography>
                <SignUpButton sourcePage={`/products/${params.businessSlug}/${params.productSlug}/join`} role="affiliate" fullWidth />
              </Stack>
            )}

            {authUser && alreadyJoined && (
              <Stack spacing={2} alignItems="center">
                <Alert severity="success" sx={{ width: "100%" }}>
                  You&apos;re already enrolled in this program.
                </Alert>
                <Button variant="contained" size="large" fullWidth component={Link} href="/dashboard/promotions">
                  Go to My Promotions
                </Button>
              </Stack>
            )}

            {authUser && !alreadyJoined && !joinState.success && (
              <Stack spacing={2} alignItems="center">
                {joinState.error && (
                  <Alert severity="error" sx={{ width: "100%" }}>
                    {joinState.error}
                  </Alert>
                )}
                <Typography variant="body2" sx={{ color: tokens.muted, textAlign: "center" }}>
                  You&apos;ll get a unique referral link to share the moment you join.
                </Typography>
                {searchParams.get("ref") && (
                  <Typography variant="caption" sx={{ color: tokens.muted, textAlign: "center" }}>
                    You were invited by another affiliate - you&apos;ll be linked to them as your recruiter.
                  </Typography>
                )}
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={joinState.loading}
                  onClick={handleJoin}
                  sx={{ py: 1.5, borderRadius: "12px", textTransform: "uppercase", fontSize: 13, letterSpacing: 0.5 }}
                >
                  {joinState.loading ? "Joining…" : "Join this program"}
                </Button>
              </Stack>
            )}

            {authUser && joinState.success && (
              <Stack spacing={2} alignItems="center">
                <Alert severity="success" sx={{ width: "100%" }}>
                  You&apos;re in! Your referral link is ready in My Promotions.
                </Alert>
                <Button variant="contained" size="large" fullWidth component={Link} href="/dashboard/promotions">
                  Get my referral link
                </Button>
              </Stack>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function JoinProgramPage() {
  return (
    <Suspense fallback={null}>
      <JoinProgramInner />
    </Suspense>
  );
}
