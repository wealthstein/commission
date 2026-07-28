"use client";

import { Box, Container, Typography, Paper } from "@mui/material";
import { tokens } from "@/lib/theme";

export default function EarningsExample({ data }) {
  return (
    <Box component="section" sx={{ py: { xs: 6, md: 9 }, borderTop: `1px solid ${tokens.border}` }}>
      <Container maxWidth="lg">
        <Paper
          sx={{
            bgcolor: tokens.ink,
            color: "#fff",
            borderRadius: 4,
            p: { xs: 4, md: 6 },
          }}
        >
          <Typography variant="overline" sx={{ color: tokens.brand, letterSpacing: 1.2 }}>
            {data.title}
          </Typography>
          <Typography variant="h4" sx={{ mt: 1.5, maxWidth: 640, fontWeight: 500, lineHeight: 1.4 }}>
            {data.body}
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
