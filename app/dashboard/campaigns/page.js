"use client";

import { useState } from "react";
import Link from "next/link";
import { Paper, Box, Typography, Chip, Button, Stack, ToggleButtonGroup, ToggleButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LaptopMacRoundedIcon from "@mui/icons-material/LaptopMacRounded";
import PageHeader from "@/components/dashboard/PageHeader";
import { sampleProducts } from "@/lib/sampleData";
import { tokens } from "@/lib/theme";

// Production query: supabase.from("products").select("*").eq("business_id", myBusinessId)

const TYPE_META = {
  physical: { label: "Physical", icon: Inventory2RoundedIcon },
  digital: { label: "Digital", icon: LaptopMacRoundedIcon },
};

export default function CampaignsPage() {
  const [typeFilter, setTypeFilter] = useState("all");

  const products = typeFilter === "all" ? sampleProducts : sampleProducts.filter((p) => p.product_type === typeFilter);

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
          bgcolor: "#F1EFE7",
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

      <Paper variant="outlined" sx={{ borderColor: tokens.border, borderRadius: 3, overflow: "hidden" }}>
        {products.map((p, i) => {
          const meta = TYPE_META[p.product_type];
          const TypeIcon = meta.icon;
          return (
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
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                  <Typography fontWeight={700}>{p.name}</Typography>
                  <Chip
                    size="small"
                    icon={<TypeIcon sx={{ fontSize: 14 }} />}
                    label={meta.label}
                    sx={{ bgcolor: p.product_type === "physical" ? "#F1EFE7" : "#FFF3C4", fontWeight: 600, height: 22 }}
                  />
                </Stack>
                <Typography variant="caption" sx={{ color: tokens.muted }}>
                  {p.category} · ₦{p.price.toLocaleString()}
                  {p.product_type === "digital" ? ` / ${p.billing}` : " one-time"}
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
                    bgcolor: p.status === "active" ? "#E7F5EE" : "#F1EFE7",
                    color: p.status === "active" ? tokens.success : tokens.muted,
                    fontWeight: 700,
                  }}
                />
              </Stack>
            </Box>
          );
        })}
        {products.length === 0 && (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography sx={{ color: tokens.muted }}>
              No {typeFilter !== "all" ? TYPE_META[typeFilter].label.toLowerCase() : ""} campaigns yet. List your
              first campaign to launch an affiliate program.
            </Typography>
          </Box>
        )}
      </Paper>
    </>
  );
}
