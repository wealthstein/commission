"use client";

import { useEffect, useState } from "react";
import { Grid, Paper, Typography, Chip, Button, Stack, InputBase, Box, CircularProgress, Alert } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";

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
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      let myUserId = null;
      if (authUser) {
        const { data: userRow } = await supabase.from("users").select("id").eq("auth_user_id", authUser.id).single();
        myUserId = userRow?.id || null;
        setUserRowId(myUserId);
      }

      const { data } = await supabase
        .from("products")
        .select("id, name, category, price_naira, businesses(name), affiliate_programs!inner(id, tier1_percent, tier2_percent, tier3_percent, status)")
        .eq("affiliate_programs.status", "active");
      setPrograms(data || []);

      if (myUserId) {
        const { data: enrolled } = await supabase.from("affiliate_enrollments").select("program_id").eq("affiliate_id", myUserId);
        setJoinedIds(new Set((enrolled || []).map((e) => e.program_id)));
      }

      setLoading(false);
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
            const program = p.affiliate_programs;
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
