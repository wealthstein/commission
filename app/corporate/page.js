import Link from "next/link";
import { Box, Container, Typography, Grid, Paper } from "@mui/material";
import { tokens } from "@/lib/theme";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";

export const metadata = {
  title: "Corporate | Commission",
  description: "About Commission, how to contact us, careers, and our terms, privacy, and security pages.",
};

const CORPORATE_PAGES = [
  { name: "About", href: "/about", description: "What Commission is and how it works." },
  { name: "Contact", href: "/contact", description: "Get in touch with the Commission team." },
  { name: "Careers", href: "/careers", description: "Open roles at Commission, when there are any." },
  { name: "Terms", href: "/terms", description: "Terms governing use of Commission." },
  { name: "Privacy", href: "/privacy", description: "How Commission handles data for businesses, affiliates, and leads." },
  { name: "Security", href: "/security", description: "How Commission approaches data security and payment handling." },
];

export default function CorporateIndexPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg">
          <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
            Corporate
          </Typography>
          <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5, maxWidth: 640 }}>
            About Commission, how to reach us, and our policies.
          </Typography>

          <Grid container spacing={2.5}>
            {CORPORATE_PAGES.map((page) => (
              <Grid item xs={12} sm={6} md={4} key={page.href}>
                <Paper
                  component={Link}
                  href={page.href}
                  variant="outlined"
                  sx={{ display: "block", p: 3, borderRadius: 3, borderColor: tokens.border, height: "100%", "&:hover": { borderColor: tokens.ink } }}
                >
                  <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                    {page.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted }}>
                    {page.description}
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
