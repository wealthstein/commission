"use client";

import { Box, Container, Typography, Button, Stack, Grid } from "@mui/material";
import { tokens } from "@/lib/theme";

export function CTASection({ content, onPrimaryCta }) {
  return (
    <Box component="section" sx={{ py: { xs: 7, md: 10 } }}>
      <Container maxWidth="md">
        <Box
          sx={{
            bgcolor: tokens.brand,
            borderRadius: 4,
            p: { xs: 4, md: 7 },
            textAlign: "center",
          }}
        >
          <Typography variant="h3" sx={{ color: tokens.brandInk, fontSize: { xs: 26, md: 34 }, mb: 2 }}>
            {content.headline}
          </Typography>
          <Typography sx={{ color: tokens.brandInk, opacity: 0.85, mb: 3.5, maxWidth: 480, mx: "auto" }}>
            {content.subhead}
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={onPrimaryCta}
            sx={{ bgcolor: tokens.ink, color: "#fff", "&:hover": { bgcolor: "#000" } }}
          >
            {content.primaryCta}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export function Footer() {
  return (
    <Box component="footer" sx={{ borderTop: `1px solid ${tokens.border}`, py: 5 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          <Grid item xs={12} sm={4}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              Commission
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.muted, maxWidth: 260 }}>
              Nigeria&apos;s affiliate marketplace. All amounts on the platform are in Naira (₦).
            </Typography>
          </Grid>
          <Grid item xs={12} sm={7}>
            <Stack direction="row" spacing={4} flexWrap="wrap" justifyContent={{ xs: "flex-start", sm: "flex-end" }}>
              <Stack spacing={1}>
                <Typography variant="caption" fontWeight={700} sx={{ color: tokens.muted }}>
                  PRODUCT
                </Typography>
                <Typography variant="body2" component="a" href="#benefits">Benefits</Typography>
                <Typography variant="body2" component="a" href="#how-it-works">How it works</Typography>
                <Typography variant="body2" component="a" href="#faq">FAQ</Typography>
              </Stack>
              <Stack spacing={1}>
                <Typography variant="caption" fontWeight={700} sx={{ color: tokens.muted }}>
                  COMPANY
                </Typography>
                <Typography variant="body2" component="a" href="mailto:hello@commission.ng">Contact</Typography>
                <Typography variant="body2" component="a" href="/terms">Terms</Typography>
                <Typography variant="body2" component="a" href="/privacy">Privacy</Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
        <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mt: 4 }}>
          © {new Date().getFullYear()} Commission. commission.ng
        </Typography>
      </Container>
    </Box>
  );
}
