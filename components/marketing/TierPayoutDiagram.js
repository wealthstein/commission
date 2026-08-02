"use client";

import { Box, Typography, Stack } from "@mui/material";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import { tokens } from "@/lib/theme";

const TIER_COLORS = [tokens.brand, "#FFE280", "#FFF3C4"];

/**
 * items: [{ tier, label, sublabel, percent, amountNaira }]
 * e.g. [{ tier: 1, label: "Kemi", sublabel: "Generated the sale", percent: 50, amountNaira: 5000 }, ...]
 */
export default function TierPayoutDiagram({ items, poolLabel }) {
  return (
    <Box sx={{ border: `1px solid ${tokens.border}`, borderRadius: 3, p: { xs: 3, md: 4 } }}>
      {poolLabel && (
        <Typography variant="caption" fontWeight={700} sx={{ color: tokens.muted, display: "block", mb: 2, textAlign: "center" }}>
          {poolLabel.toUpperCase()}
        </Typography>
      )}
      <Stack spacing={1.5} alignItems="center">
        {items.map((item, i) => (
          <Box key={item.tier} sx={{ width: "100%", maxWidth: 420 }}>
            <Box
              sx={{
                bgcolor: TIER_COLORS[i] || tokens.paper,
                borderRadius: 2.5,
                px: 2.5,
                py: 1.75,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography variant="caption" fontWeight={700} sx={{ color: tokens.brandInk, display: "block" }}>
                  TIER {item.tier} · {item.percent}%
                </Typography>
                <Typography fontWeight={700} sx={{ color: tokens.brandInk }}>
                  {item.label}
                </Typography>
                {item.sublabel && (
                  <Typography variant="caption" sx={{ color: tokens.brandInk, opacity: 0.75 }}>
                    {item.sublabel}
                  </Typography>
                )}
              </Box>
              <Typography fontWeight={700} sx={{ color: tokens.brandInk, fontSize: 18 }}>
                ₦{item.amountNaira.toLocaleString()}
              </Typography>
            </Box>
            {i < items.length - 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 0.5 }}>
                <ArrowDownwardRoundedIcon sx={{ color: tokens.muted, fontSize: 18 }} />
              </Box>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
