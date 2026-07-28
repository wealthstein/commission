"use client";

import { Box, Typography } from "@mui/material";
import { tokens } from "@/lib/theme";

/**
 * The signature element for the Commission brand: a sale amount cascading
 * down through up to 3 affiliate tiers, each peeling off its percentage,
 * with the remainder landing in the business's pocket. This is the one
 * idea in the product worth making memorable — money moving through a
 * hierarchy — so the hero shows it literally rather than illustrating it
 * with a generic stat card.
 */
export default function CommissionSplitDiagram() {
  const rows = [
    { label: "Sale", value: "₦100,000", color: tokens.ink, textColor: "#fff", width: 100 },
    { label: "Tier 1 · Kemi", value: "8% → ₦8,000", color: tokens.brand, textColor: tokens.brandInk, width: 78 },
    { label: "Tier 2 · Abu", value: "5% → ₦5,000", color: "#FFE280", textColor: tokens.brandInk, width: 58 },
    { label: "Tier 3 · Ola", value: "2% → ₦2,000", color: "#FFF3C4", textColor: tokens.brandInk, width: 42 },
    { label: "Business keeps", value: "₦85,000", color: tokens.paper, textColor: tokens.ink, width: 100 },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 420,
        border: `1px solid ${tokens.border}`,
        borderRadius: 4,
        p: 3,
        bgcolor: tokens.paper,
        boxShadow: "0 24px 48px -24px rgba(11,11,12,0.18)",
      }}
    >
      <Typography variant="overline" sx={{ color: tokens.muted, letterSpacing: 1.2 }}>
        How one sale splits
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.1, mt: 1.5 }}>
        {rows.map((row, i) => (
          <Box
            key={row.label}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: `${row.width}%`,
              bgcolor: row.color,
              color: row.textColor,
              borderRadius: 2,
              px: 1.5,
              py: 1,
              border: row.color === tokens.paper ? `1px dashed ${tokens.border}` : "none",
              animation: `commissionRowIn 480ms ease ${i * 90}ms both`,
              "@keyframes commissionRowIn": {
                from: { opacity: 0, transform: "translateX(-8px)" },
                to: { opacity: 1, transform: "translateX(0)" },
              },
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              {row.label}
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              {row.value}
            </Typography>
          </Box>
        ))}
      </Box>
      <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mt: 2 }}>
        Commission only takes its fee from the affiliate commission — never from the sale itself.
      </Typography>
    </Box>
  );
}
