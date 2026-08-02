import { Box, Container, Typography, Grid, Paper, Chip, Button } from "@mui/material";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";

export const metadata = {
  title: "Contact Commission • Commission",
  description: "Get in touch with the Commission team.",
};

const CHANNELS = [
  {
    title: "Business inquiries",
    body: "Questions about listing a campaign, pricing, or how the platform works for your business.",
    cta: "Email hello@commission.ng",
    href: "mailto:hello@commission.ng?subject=Business%20inquiry",
  },
  {
    title: "Affiliate support",
    body: "Questions about promoting programs, commissions, or getting paid.",
    cta: "Email hello@commission.ng",
    href: "mailto:hello@commission.ng?subject=Affiliate%20support",
  },
  {
    title: "Partnerships & press",
    body: "Media inquiries, partnership proposals, or anything else.",
    cta: "Email hello@commission.ng",
    href: "mailto:hello@commission.ng?subject=Partnerships%20and%20press",
  },
];

export default function ContactPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 640, mb: 6 }}>
            <Chip label="Contact" size="small" sx={{ bgcolor: "#F1EFE7", fontWeight: 600, mb: 2 }} />
            <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 42 }, mb: 2 }}>
              Talk to a real person
            </Typography>
            <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400 }}>
              Pick whichever fits best - every message reaches the same small team.
            </Typography>
          </Box>

          <Grid container spacing={2.5} sx={{ mb: 5 }}>
            {CHANNELS.map((c) => (
              <Grid item xs={12} md={4} key={c.title}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, height: "100%", display: "flex", flexDirection: "column" }}>
                  <Typography fontWeight={700} sx={{ mb: 1 }}>
                    {c.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted, mb: 2, flexGrow: 1 }}>
                    {c.body}
                  </Typography>
                  <Button variant="outlined" href={c.href} sx={{ alignSelf: "flex-start" }}>
                    {c.cta}
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Typography variant="body2" sx={{ color: tokens.muted }}>
            Not ready to write an email? Request early access from the{" "}
            <Typography component="a" href={urls.audienceHome("business")} sx={{ color: tokens.ink, fontWeight: 600, display: "inline" }}>
              business
            </Typography>{" "}
            or{" "}
            <Typography component="a" href={urls.audienceHome("affiliate")} sx={{ color: tokens.ink, fontWeight: 600, display: "inline" }}>
              affiliate
            </Typography>{" "}
            page instead, and we will reach out to you.
          </Typography>
        </Container>
      </Box>
    </MarketingPageShell>
  );
}
