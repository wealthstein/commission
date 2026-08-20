"use client";

import { useEffect, useState } from "react";
import { Grid, Paper, Typography, Chip, Button, Stack, InputBase, Box, CircularProgress, Alert } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";

// Matches the affiliate-cap trigger in supabase/schema.sql
// (fn_enforce_affiliate_cap) exactly - null means unlimited.
const AFFILIATE_CAP = { free: 5, pro: 25, plus: null };

export default function DiscoverPage() {
  const [loading, setLoading] = useState(true);
  const [userRowId, setUserRowId] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [joinedIds, setJoinedIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [joining, setJoining] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      try {
        // The products query has zero dependency on auth state - only the
        // LATER filtering below needs myUserId/myBusinessId. Starting it
        // alongside the auth check instead of after it cuts a full
        // round-trip off what was previously a strict sequential chain.
        const [{ data: authData }, { data: productsData }] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("products")
            .select(
              "id, name, category, price_naira, business_id, businesses(id, name, plan), affiliate_programs!inner(id, tier1_percent, tier2_percent, tier3_percent, status)"
            )
            .eq("affiliate_programs.status", "active"),
        ]);
        const authUser = authData?.user;

        let visible = productsData || [];
        let myUserId = null;
        let myBusinessId = null;

        if (authUser) {
          const { data: userRow } = await supabase.from("users").select("id").eq("auth_user_id", authUser.id).single();
          myUserId = userRow?.id || null;
          setUserRowId(myUserId);

          if (myUserId) {
            // Business lookup and "which programs have I already joined"
            // both only depend on myUserId, not on each other or on the
            // products data above - run them together instead of in
            // sequence.
            const [{ data: myBusiness }, { data: enrolled }] = await Promise.all([
              supabase.from("businesses").select("id").eq("owner_id", myUserId).maybeSingle(),
              supabase.from("affiliate_enrollments").select("program_id").eq("affiliate_id", myUserId),
            ]);
            myBusinessId = myBusiness?.id || null;
            setJoinedIds(new Set((enrolled || []).map((e) => e.program_id)));
          }
        }

        // Never show a business's own campaigns to themselves in Discover -
        // joining your own program as an affiliate doesn't make sense.
        if (myBusinessId) {
          visible = visible.filter((p) => p.business_id !== myBusinessId);
        }

        // Hide campaigns from businesses that have already hit their plan's
        // affiliate cap - nothing to join if they're full. Computed by
        // counting DISTINCT affiliates already enrolled across each
        // business's programs, same logic as the enforcement trigger.
        // This genuinely can't start any earlier - it needs businessIds,
        // which only exist once the products query above has resolved.
        const businessIds = [...new Set(visible.map((p) => p.business_id))];
        if (businessIds.length > 0) {
          const { data: allEnrollments } = await supabase
            .from("affiliate_enrollments")
            .select("affiliate_id, affiliate_programs(products(business_id))");

          const affiliatesByBusiness = new Map();
          for (const e of allEnrollments || []) {
            const bizId = e.affiliate_programs?.products?.business_id;
            if (!bizId || !businessIds.includes(bizId)) continue;
            if (!affiliatesByBusiness.has(bizId)) affiliatesByBusiness.set(bizId, new Set());
            affiliatesByBusiness.get(bizId).add(e.affiliate_id);
          }

          visible = visible.filter((p) => {
            const cap = AFFILIATE_CAP[p.businesses?.plan] ?? AFFILIATE_CAP.free;
            if (cap === null) return true; // unlimited (Large)
            const currentCount = affiliatesByBusiness.get(p.business_id)?.size || 0;
            return currentCount < cap;
          });
        }

        setPrograms(visible);
      } catch (err) {
        // Previously unhandled entirely - any failure anywhere in the
        // sequence above left the page spinning forever with no error
        // shown at all. Now it surfaces to the same error state the join
        // button already uses, and the spinner always resolves via finally
        // below regardless of whether this succeeded or failed.
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleJoin(programId) {
    if (!userRowId) return;
    setJoining(programId);
    setError(null);
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from("affiliate_enrollments")
        .insert({ affiliate_id: userRowId, program_id: programId });
      if (insertError) throw insertError;
      setJoinedIds((prev) => new Set(prev).add(programId));
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(null);
    }
  }

  const filtered = programs.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.businesses?.name?.toLowerCase().includes(q);
  });

  return (
    <>
      <PageHeader title="Discover" subtitle="Find campaigns to promote." />

      <Paper
        variant="outlined"
        sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1, mb: 3, borderRadius: 999, borderColor: tokens.border }}
      >
        <SearchIcon fontSize="small" sx={{ color: tokens.muted }} />
        <InputBase
          placeholder="Search campaigns, categories, businesses…"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map((p) => {
            const program = Array.isArray(p.affiliate_programs) ? p.affiliate_programs[0] : p.affiliate_programs;
            if (!program) return null;
            const tierCount = [program.tier1_percent, program.tier2_percent, program.tier3_percent].filter(Boolean).length;
            const alreadyJoined = joinedIds.has(program.id);
            return (
              <Grid item xs={12} sm={6} md={4} key={p.id}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, height: "100%" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                    <Chip label={p.category || "General"} size="small" sx={{ bgcolor: "#F7F6F2", fontWeight: 600 }} />
                    <Chip label={`${tierCount} tier${tierCount === 1 ? "" : "s"}`} size="small" variant="outlined" />
                  </Stack>
                  <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                    {p.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
                    {p.businesses?.name}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: tokens.muted }}>
                      Tier 1 commission
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {program.tier1_percent}%
                    </Typography>
                  </Box>
                  <Button
                    fullWidth
                    variant={alreadyJoined ? "outlined" : "contained"}
                    disabled={alreadyJoined || joining === program.id}
                    onClick={() => handleJoin(program.id)}
                  >
                    {alreadyJoined ? "Joined" : joining === program.id ? "Joining…" : "Join program"}
                  </Button>
                </Paper>
              </Grid>
            );
          })}
          {filtered.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ p: 5, textAlign: "center" }}>
                <Typography sx={{ color: tokens.muted }}>No live campaigns match your search right now.</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </>
  );
}