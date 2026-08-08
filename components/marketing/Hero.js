"use client";

import { Box, Container, Typography, Button, Stack, Chip } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { tokens } from "@/lib/theme";
import HeroCalculatorTeaser from "./HeroCalculatorTeaser";

export default function Hero({ content, audience, onPrimaryCta }) {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: "column", md: "row" }} spacing={6} alignItems="center">
          <Box sx={{ flex: 1 }}>
            <Chip
              label={content.eyebrow}
              size="small"
              sx={{ bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700, mb: 3 }}
            />
            <Typography variant="h1" sx={{ fontSize: { xs: 34, md: 52 }, lineHeight: 1.08, mb: 3 }}>
              {content.headline}
            </Typography>
            <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, maxWidth: 480, mb: 3 }}>
              {content.subhead}
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.muted, maxWidth: 480, mb: 4 }}>
              Commission is an affiliate marketing platform that lets businesses in Nigeria set up commission-based
              referral programs, track affiliate sales, and pay out automatically via Paystack.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={onPrimaryCta}
              >
                {content.primaryCta}
              </Button>
              <Button variant="outlined" size="large" href="#how-it-works">
                {content.secondaryCta}
              </Button>
            </Stack>
          </Box>
          <Box sx={{ flex: 1, display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, width: "100%" }}>
            {audience === "business" ? <HeroCalculatorTeaser audience="business" /> : <HeroCalculatorTeaser audience="affiliate" />}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}