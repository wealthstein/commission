"use client";

import { Paper, Typography, Box } from "@mui/material";
import { tokens } from "@/lib/theme";

export default function StatCard({ label, value, hint, accent }) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, borderRadius: 3, borderColor: tokens.border, bgcolor: accent ? tokens.brand : tokens.paper }}
    >
      <Typography variant="caption" sx={{ color: accent ? tokens.brandInk : tokens.muted, fontWeight: 700 }}>
        {label.toUpperCase()}
      </Typography>
      <Typography variant="h4" sx={{ mt: 0.5, fontSize: 26, color: accent ? tokens.brandInk : tokens.ink }}>
        {value}
      </Typography>
      {hint && (
        <Box sx={{ mt: 0.5 }}>
          <Typography variant="caption" sx={{ color: accent ? tokens.brandInk : tokens.muted, opacity: 0.85 }}>
            {hint}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
