import Link from "next/link";
import { Box, Container, Typography, Grid, Paper, Chip } from "@mui/material";
import { tokens } from "@/lib/theme";
import { industryPages } from "@/lib/industryPages";
import { buildIndustriesIndexMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";

export const metadata = buildIndustriesIndexMetadata();

export default function IndustriesIndexPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg">
          <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
            Affiliate marketing by industry
          </Typography>
          <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5, maxWidth: 640 }}>
            See how businesses in each industry use Commission to acquire customers through affiliates, and what a
            qualified lead typically costs.
          </Typography>

          <Grid container spacing={2.5}>
            {industryPages.map((p) => (
              <Grid item xs={12} sm={6} md={4} key={p.slug}>
                <Paper
                  component={Link}
                  href={`/industries/${p.slug}`}
                  variant="outlined"
                  sx={{ display: "block", p: 3, borderRadius: 3, borderColor: tokens.border, height: "100%", "&:hover": { borderColor: tokens.ink } }}
                >
                  <Chip label={p.industryName} size="small" sx={{ bgcolor: "#F1EFE7", fontWeight: 600, mb: 1.5 }} />
                  <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                    {p.headline}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted }}>
                    Typical cost per qualified lead: ₦{p.ppqlNaira.toLocaleString()}
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
