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
    <Box component="footer" sx={{ bgcolor: tokens.canvas, pb: 6 }}>
      <Container maxWidth="md" sx={{ textAlign: "center" }}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 3 }}>
          <CardMedia sx={{ width: 22, height: 22, borderRadius: "6px" }} image="/circle.svg" alt="Commission" />
        </Stack>

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
            Built with ❤️ in Brooklyn, New York
          </Typography>
        </Breadcrumbs>

      </Container>
    </Box>
  );
}