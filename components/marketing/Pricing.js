"use client";

import { Box, Container, Typography, Grid, Paper, Button, Stack, Chip } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { tokens } from "@/lib/theme";
import { pricingPlans } from "@/lib/pricingPlans";

export default function Pricing({ onSelectPlan, bgcolor = tokens.paper }) {
  return (
    <Box component="section" id="pricing" sx={{ py: { xs: 7, md: 10 }, bgcolor }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 5, maxWidth: 560 }}>
          <Typography variant="h3" sx={{ fontSize: { xs: 24, md: 30 }, mb: 1.5 }}>
            Simple, plan-based pricing
          </Typography>
          <Typography variant="body1" sx={{ color: tokens.muted }}>
            Every plan supports 3-tier affiliate programs and automatic payouts. The only thing that changes as you
            upgrade is how much of the affiliate commission Commission keeps — the rest always goes to your affiliates.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {pricingPlans.map((plan) => (
            <Grid item xs={12} md={4} key={plan.id}>
              <Paper
                variant="outlined"
                sx={{
                  p: 4,
                  height: "100%",
                  borderRadius: 4,
                  borderColor: plan.highlighted ? tokens.ink : tokens.border,
                  borderWidth: plan.highlighted ? 2 : 1,
                  position: "relative",
                  bgcolor: tokens.paper,
                }}
              >
                {plan.highlighted && (
                  <Chip
                    label="Most popular"
                    size="small"
                    sx={{ position: "absolute", top: -12, left: 24, bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700 }}
                  />
                )}
                <Typography fontWeight={700} sx={{ fontSize: 20, mb: 0.5 }}>
                  {plan.name}
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.muted, mb: 2.5, minHeight: 40 }}>
                  {plan.tagline}
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontSize: 34, fontWeight: 700 }}>
                    {plan.priceNaira === 0 ? "₦0" : `₦${plan.priceNaira.toLocaleString()}`}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted }}>
                    {plan.priceSuffix}
                  </Typography>
                </Stack>
                <Chip
                  label={`Commission keeps ${plan.feePercent}%`}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 3, fontWeight: 600, borderColor: tokens.border }}
                />
                <Stack spacing={1.25} sx={{ mb: 3 }}>
                  {plan.features.map((f) => (
                    <Stack key={f} direction="row" spacing={1} alignItems="flex-start">
                      <CheckRoundedIcon sx={{ fontSize: 18, color: tokens.success, mt: 0.2 }} />
                      <Typography variant="body2">{f}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <Button
                  fullWidth
                  variant={plan.highlighted ? "contained" : "outlined"}
                  size="large"
                  onClick={() => onSelectPlan?.(plan.id)}
                >
                  {plan.cta}
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
