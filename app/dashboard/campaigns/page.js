"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Paper, Box, Typography, Chip, Button, Stack, ToggleButtonGroup, ToggleButton, CircularProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LaptopMacRoundedIcon from "@mui/icons-material/LaptopMacRounded";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";

const TYPE_META = {
  physical: { label: "Physical", icon: Inventory2RoundedIcon },
  digital: { label: "Digital", icon: LaptopMacRoundedIcon },
};

export default function CampaignsPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }
      const { data: userRow } = await supabase.from("users").select("id").eq("auth_user_id", authUser.id).single();
      if (!userRow) {
        setLoading(false);
        return;
      }
      const { data: business } = await supabase.from("businesses").select("id").eq("owner_id", userRow.id).maybeSingle();
      if (!business) {
        setLoading(false);
        return;
      }

      const { data: rows } = await supabase
        .from("products")
        .select("id, name, category, product_type, price_naira, billing_frequency, status, affiliate_programs(id)")
        .eq("business_id", business.id);

      const programIds = (rows || []).flatMap((p) => p.affiliate_programs?.map((ap) => ap.id) || []);
      let countsByProgram = {};
      if (programIds.length > 0) {
        const { data: enrollments } = await supabase.from("affiliate_enrollments").select("program_id").in("program_id", programIds);
        countsByProgram = (enrollments || []).reduce((acc, e) => {
          acc[e.program_id] = (acc[e.program_id] || 0) + 1;
          return acc;
        }, {});
      }

      setProducts(
        (rows || []).map((p) => ({
          ...p,
          affiliates: (p.affiliate_programs || []).reduce((sum, ap) => sum + (countsByProgram[ap.id] || 0), 0),
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  const filtered = typeFilter === "all" ? products : products.filter((p) => p.product_type === typeFilter);

  return (
    <>
      <PageHeader
        title="My Campaigns"
        subtitle="What you're selling and the affiliate programs running on each one."
        action={
          <Button component={Link} href="/dashboard/campaigns/new" variant="contained" startIcon={<AddIcon />}>
            New campaign
          </Button>
        }
      />

      <ToggleButtonGroup
        value={typeFilter}
        exclusive
        size="small"
        onChange={(_, v) => v && setTypeFilter(v)}
        sx={{
          mb: 3,
          bgcolor: "#F7F6F2",
          borderRadius: 999,
          p: 0.4,
          "& .MuiToggleButton-root": {
            border: "none",
            borderRadius: 999,
            px: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: 13,
            color: tokens.muted,
            gap: 0.75,
          },
          "& .Mui-selected": { bgcolor: `${tokens.paper} !important`, color: `${tokens.ink} !important` },
        }}
      >
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="physical">
          <Inventory2RoundedIcon sx={{ fontSize: 16 }} /> Physical
        </ToggleButton>
        <ToggleButton value="digital">
          <LaptopMacRoundedIcon sx={{ fontSize: 16 }} /> Digital
        </ToggleButton>
      </ToggleButtonGroup>

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ borderColor: tokens.border, borderRadius: 3, overflow: "hidden" }}>
          {filtered.map((p, i) => {
            const meta = TYPE_META[p.product_type] || TYPE_META.digital;
            const TypeIcon = meta.icon;
            return (
              <Box
                key={p.id}
                component={Link}
                href={`/dashboard/campaigns/${p.id}/edit`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2.5,
                  py: 2,
                  borderTop: i === 0 ? "none" : `1px solid ${tokens.border}`,
                  gap: 2,
                  flexWrap: "wrap",
                  textDecoration: "none",
                  color: "inherit",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#FAFAF8" },
                }}
              >
                <Box sx={{ minWidth: 200 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                    <Typography fontWeight={700}>{p.name}</Typography>
                    <Chip
                      size="small"
                      icon={<TypeIcon sx={{ fontSize: 14 }} />}
                      label={meta.label}
                      sx={{ bgcolor: p.product_type === "physical" ? "#F7F6F2" : "#FFF3C4", fontWeight: 600, height: 22 }}
                    />
                  </Stack>
                  <Typography variant="caption" sx={{ color: tokens.muted }}>
                    {p.category} · ₦{Number(p.price_naira).toLocaleString()}
                    {p.product_type === "digital" ? ` / ${p.billing_frequency}` : " one-time"}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
                      Affiliates
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {p.affiliates}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={p.status}
                    sx={{
                      textTransform: "capitalize",
                      bgcolor: p.status === "active" ? "#E7F5EE" : "#F7F6F2",
                      color: p.status === "active" ? tokens.success : tokens.muted,
                      fontWeight: 700,
                    }}
                  />
                </Stack>
              </Box>
            );
          })}
          {filtered.length === 0 && (
            <Box sx={{ p: 5, textAlign: "center" }}>
              <Typography sx={{ color: tokens.muted }}>
                No {typeFilter !== "all" ? TYPE_META[typeFilter].label.toLowerCase() : ""} campaigns yet. List your
                first campaign to launch an affiliate program.
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </>
  );
}