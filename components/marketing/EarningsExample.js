"use client";

import { Box, Container, Typography, Paper } from "@mui/material";
import { tokens } from "@/lib/theme";

export default function EarningsExample({ data, bgcolor = tokens.paper }) {
  return (
    <Box component="section" id="what-you-earn" sx={{ py: { xs: 6, md: 9 }, bgcolor }}>
      <Container maxWidth="md">
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
