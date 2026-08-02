"use client";

import { Box, Container, Typography, Paper } from "@mui/material";
import { tokens } from "@/lib/theme";

export default function Comparison({ data, bgcolor = tokens.paper }) {
  return (
    <Box component="section" sx={{ py: { xs: 6, md: 9 }, bgcolor }}>
      <Container maxWidth="lg">
        <Typography variant="h3" sx={{ fontSize: { xs: 24, md: 30 }, mb: 4 }}>
          {data.title}
        </Typography>
        <Paper variant="outlined" sx={{ borderColor: tokens.border, borderRadius: 3, overflow: "hidden" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr",
              bgcolor: "#F1EFE7",
              px: { xs: 2, md: 3 },
              py: 1.5,
            }}
          >
            <Typography variant="caption" fontWeight={700} sx={{ color: tokens.muted }}>
              CAPABILITY
            </Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: tokens.muted }}>
              DIY
            </Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: tokens.brandInk }}>
              WITH COMMISSION
            </Typography>
          </Box>
          {data.rows.map(([label, diy, withUs], i) => (
            <Box
              key={label}
              sx={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr 1fr",
                px: { xs: 2, md: 3 },
                py: 2,
                borderTop: `1px solid ${tokens.border}`,
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                {label}
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.muted }}>
                {diy}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {withUs}
              </Typography>
            </Box>
          ))}
        </Paper>
      </Container>
    </Box>
  );
}
