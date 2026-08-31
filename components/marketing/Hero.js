"use client";

import { Box, Container, Typography, Button, Stack, Grid } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { tokens } from "@/lib/theme";
import { withPeriod } from "@/lib/textFormat";
import SectionLabel from "./SectionLabel";
import HeroCalculatorTeaser from "./HeroCalculatorTeaser";

/**
 * DUMMY DATA - not real, not yet reflective of actual usage. Commission
 * hasn't launched with real businesses/affiliates yet. This must be
 * clearly labeled as illustrative on the live page and swapped for
 * genuine figures the moment real ones exist - shipping these as
 * unlabeled fact to real visitors would be a false claim about the
 * platform's actual track record, not a style choice.
 */
const STATS = {
  business: [
    { value: "750K+", label: "Verified Affiliates" },
    { value: "₦4.5B+", label: "Affiliate Sales Generated" },
    { value: "125K+", label: "Customers Acquired" },
  ],
  affiliate: [
    { value: "470+", label: "Active Campaigns" },
    { value: "₦45K+", label: "Average Earnings per Customer" },
    { value: "₦820M+", label: "Paid to Affiliates" },
  ],
};

export default function Hero({ content, audience, onPrimaryCta }) {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: tokens.paper }}>
      <Container maxWidth="md">
        <Grid container spacing={6}>
          <Grid item xs={12} md={6}>
            <SectionLabel>{content.eyebrow}</SectionLabel>
            <Typography variant="h1" sx={{ fontSize: { xs: 34, md: 48 }, lineHeight: 1.08, mb: 3 }}>
              {withPeriod(content.headline)}
            </Typography>
            <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, maxWidth: 480, mb: 4 }}>
              {content.subhead}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={onPrimaryCta}
                sx={{ textTransform: "uppercase", fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}
              >
                {content.primaryCta}
              </Button>
              <Button
                variant="outlined"
                size="large"
                href="#how-it-works"
                sx={{ textTransform: "uppercase", fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}
              >
                {content.secondaryCta}
              </Button>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
            {audience === "business" ? <HeroCalculatorTeaser audience="business" /> : <HeroCalculatorTeaser audience="affiliate" />}
          </Grid>
        </Grid>

        {/*
        <Box sx={{ borderTop: `1px solid ${tokens.border}`, mt: { xs: 6, md: 8 }, pt: { xs: 4, md: 5 }, textAlign: "center" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 3, md: 8 }} justifyContent="center" alignItems="center">
            {STATS[audience].map((stat) => (
              <Box key={stat.label}>
                <Typography sx={{ fontSize: { xs: 24, md: 30 }, fontWeight: 700, lineHeight: 1.1 }}>{stat.value}</Typography>
                <Typography variant="body2" sx={{ color: tokens.muted }}>
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
        */}
      </Container>
    </Box>
  );
}
