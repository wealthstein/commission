import { Box, Container, Typography, Grid, Paper, Chip, Button } from "@mui/material";
import { tokens } from "@/lib/theme";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";

export const metadata = {
  title: "Careers at Commission • Commission",
  description: "Commission is a small, early-stage team building a Nigerian affiliate marketplace. See what we look for and how to reach out.",
};

const VALUES = [
  {
    title: "Build for how Nigeria actually transacts",
    body: "Naira-first pricing, Paystack settlement, real affiliate trust scoring - we design around real usage, not a generic template.",
  },
  {
    title: "Trust is earned through mechanics, not copy",
    body: "Never storing lead PII, automatic payouts, transparent fee structure - the product itself is the trust signal.",
  },
  {
    title: "Small team, real ownership",
    body: "Early-stage means fewer people doing more - if that is not for you, that is a completely fair reason to wait.",
  },
];

export default function CareersPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="md">
          <Box sx={{ maxWidth: 640, mb: 6 }}>
            <Chip label="Careers" size="small" sx={{ bgcolor: "#F7F6F2", fontWeight: 600, mb: 2 }} />
            <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 42 }, mb: 2 }}>
              No open roles right now - but we are building fast
            </Typography>
            <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400 }}>
              Commission is a small, early-stage team. There is nothing formally listed today, but here is what we
              look for when there is.
            </Typography>
          </Box>

          <Grid container spacing={2.5} sx={{ mb: 6 }}>
            {VALUES.map((v) => (
              <Grid item xs={12} md={4} key={v.title}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, height: "100%" }}>
                  <Typography fontWeight={700} sx={{ mb: 1 }}>
                    {v.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted }}>
                    {v.body}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: tokens.border, maxWidth: 640 }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              Want to be first in line when we do open a role?
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.muted, mb: 2.5 }}>
              Send a short note about what you would want to work on - engineering, growth, or partnerships - and
              we will reach out when something fits.
            </Typography>
            <Button variant="contained" href="mailto:work@commission.ng?subject=Speculative%20application">
              Email work@commission.ng
            </Button>
          </Paper>
        </Container>
      </Box>
    </MarketingPageShell>
  );
}
