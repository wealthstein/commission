"use client";

import { Box, Container, Typography, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";

export default function HowItWorks({ steps, bgcolor = tokens.paper }) {
  return (
    <Box component="section" id="how-it-works" sx={{ py: { xs: 6, md: 9 }, bgcolor }}>
      <Container maxWidth="lg">
        <Typography variant="h3" sx={{ fontSize: { xs: 24, md: 30 }, mb: 5 }}>
          How it works
        </Typography>
        <Stack spacing={0}>
          {steps.map((step, i) => (
            <Stack
              key={step.title}
              direction="row"
              spacing={3}
              alignItems="flex-start"
              sx={{
                py: 3,
                borderTop: i === 0 ? "none" : `1px solid ${tokens.border}`,
              }}
            >
              <Typography
                variant="h4"
                sx={{ color: tokens.brand, WebkitTextStroke: `1.5px ${tokens.ink}`, minWidth: 48, fontSize: 32 }}
              >
                {String(i + 1).padStart(2, "0")}
              </Typography>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                  {step.title}
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.muted, maxWidth: 560 }}>
                  {step.body}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
