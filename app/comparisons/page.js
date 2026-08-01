import Link from "next/link";
import { Box, Container, Typography, Grid, Paper } from "@mui/material";
import { tokens } from "@/lib/theme";
import { comparisons } from "@/lib/comparisons";
import { buildComparisonsIndexMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";

export const metadata = buildComparisonsIndexMetadata();

export default function ComparisonsIndexPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg">
          <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
            Commission vs every other marketing channel
          </Typography>
          <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5, maxWidth: 640 }}>
            See how Commission compares on cost, speed, and risk against the channels businesses already spend on.
          </Typography>

          <Grid container spacing={2.5}>
            {comparisons.map((c) => (
              <Grid item xs={12} sm={6} md={4} key={c.slug}>
                <Paper
                  component={Link}
                  href={`/${c.slug}`}
                  variant="outlined"
                  sx={{ display: "block", p: 3, borderRadius: 3, borderColor: tokens.border, height: "100%", "&:hover": { borderColor: tokens.ink } }}
                >
                  <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                    {c.channelName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted }}>
                    {c.intro.slice(0, 110)}…
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </MarketingPageShell>
  );
}
