import { Box, Container, Typography, Grid, Paper, Chip, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import TwoAudienceCta from "@/components/marketing/TwoAudienceCta";

export const metadata = {
  title: "About Commission • Commission",
  description: "Commission is a Nigerian affiliate marketplace connecting businesses with affiliates who earn commission on Intent Qualified Leads and sales.",
};

const PRINCIPLES = [
  {
    title: "Pay for results, never for reach",
    body: "A business only pays Commission's platform fee when a real Intent Qualified Lead or sale happens - never for clicks, impressions, or a promise of exposure.",
  },
  {
    title: "A lead's identity is never ours to keep",
    body: "Every Intent Qualified Lead's name, phone, and email is forwarded straight to the business running that campaign and discarded on Commission's side - not stored, not resold.",
  },
  {
    title: "Automatic, tiered, and transparent",
    body: "Up to 3 tiers of affiliates get paid automatically the moment a conversion happens - no manual reconciliation, no chasing spreadsheets.",
  },
];

export default function AboutPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 720, mb: 7 }}>
            <Chip label="About Commission" size="small" sx={{ bgcolor: "#F7F6F2", fontWeight: 600, mb: 2 }} />
            <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 44 }, mb: 2.5 }}>
              A performance-based way to grow, built for how Nigerian businesses actually sell
            </Typography>
            <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, lineHeight: 1.6 }}>
              Commission connects businesses who want more customers with affiliates who already have an audience
              that trusts them - a business lists a campaign and sets what a Intent Qualified Lead or sale is worth, an
              affiliate shares a link, and the commission is tracked and paid automatically.
            </Typography>
          </Box>

          <Grid container spacing={2.5} sx={{ mb: 8 }}>
            {PRINCIPLES.map((p) => (
              <Grid item xs={12} md={4} key={p.title}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, height: "100%" }}>
                  <Typography fontWeight={700} sx={{ mb: 1 }}>
                    {p.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted }}>
                    {p.body}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Stack spacing={3} sx={{ maxWidth: 720, mb: 6 }}>
            <Typography variant="h5" fontWeight={700}>
              Why this exists
            </Typography>
            <Typography variant="body1" sx={{ color: tokens.muted, lineHeight: 1.8 }}>
              Most affiliate tooling was built for global, card-first e-commerce. Nigerian businesses close a lot of
              their real conversations on WhatsApp, and a lot of their real trust comes through referrals, not ads.
              Commission is built around that reality - a WhatsApp-native lead funnel for businesses whose customers
              need to talk before they buy, and a live, split checkout for businesses selling something a customer
              can pay for immediately.
            </Typography>
            <Typography variant="body1" sx={{ color: tokens.muted, lineHeight: 1.8 }}>
              Every part of how money moves on Commission is designed so a business never has to trust a promise -
              proceeds settle automatically, and affiliates get paid automatically, whichever conversion model a
              campaign uses.
            </Typography>
          </Stack>

          <Box sx={{ maxWidth: 640 }}>
            <TwoAudienceCta slug="about" />
          </Box>
        </Container>
      </Box>
    </MarketingPageShell>
  );
}
