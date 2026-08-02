"use client";

import { Box, Breadcrumbs, Container, Typography, Button, Stack, CardMedia } from "@mui/material";
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
    <Box component="footer" sx={{ bgcolor: tokens.canvas, py: 6 }}>
      <Container maxWidth="lg" sx={{ textAlign: "center" }}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 4 }}>
          <CardMedia sx={{ width: 22, height: 22, borderRadius: "6px" }} image="/circle.svg" alt="Commission" />
        </Stack>

        <Box
          sx={{
            bgcolor: tokens.ink,
            color: "#fff",
            borderRadius: 4,
            p: { xs: 3, md: 4 },
            mb: 4,
            maxWidth: 560,
            mx: "auto",
          }}
        >
          <Typography fontWeight={700} sx={{ mb: 0.5, fontSize: 15 }}>
            Ready to get started?
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 2.5, fontSize: 13 }}>
            Request early access as a business or an affiliate.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center">
            <Button variant="contained" href="/?for=business" size="small" sx={{ bgcolor: tokens.brand, color: tokens.brandInk, "&:hover": { bgcolor: "#E6B800" } }}>
              For businesses
            </Button>
            <Button variant="outlined" href="/?for=affiliate" size="small" sx={{ borderColor: "rgba(255,255,255,0.4)", color: "#fff" }}>
              For affiliates
            </Button>
          </Stack>
        </Box>

        <Breadcrumbs
          separator="•"
          aria-label="breadcrumb"
          sx={{
            '& ol': {
              justifyContent: 'center',
              fontSize: '12px',
              margin: 'auto',
              textDecoration: 'none'
            }
          }}
        >
          <Typography sx={{ color: tokens.muted, fontSize: 11 }}>
            © {new Date().getFullYear()} Commission
          </Typography>
          <Typography sx={{ color: tokens.muted, fontSize: 11 }}>
            Built with ❤️ in Chicago, Illinois
          </Typography>
        </Breadcrumbs>

      </Container>
    </Box>
  );
}
