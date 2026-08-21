import Link from "next/link";
import { Box, Container, Typography, Grid, Paper, Chip } from "@mui/material";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";

export const metadata = {
  title: "Corporate • Commission",
  description: "About Commission, how to contact us, careers, and our terms, privacy, and security pages.",
};

const COMPANY_PAGES = [
  { name: "About", href: urls.about(), description: "What Commission is, why it exists, and the principles behind it." },
  { name: "Contact", href: urls.contact(), description: "Reach the team directly - business, affiliate, or press." },
  { name: "Careers", href: urls.careers(), description: "No open roles today, but here is what we look for." },
];

const LEGAL_PAGES = [
  { name: "Terms of Service", href: urls.terms(), description: "What governs use of Commission." },
  { name: "Privacy Policy", href: urls.privacy(), description: "How data is handled - including the no-PII-storage principle for leads." },
  { name: "Security", href: urls.security(), description: "Payment handling, access controls, and how to report a vulnerability." },
];

function PageGroup({ label, pages }) {
  return (
    <Box sx={{ mb: 6 }}>
      <Typography variant="caption" fontWeight={700} sx={{ color: tokens.muted, display: "block", mb: 2 }}>
        {label.toUpperCase()}
      </Typography>
      <Grid container spacing={2.5}>
        {pages.map((page) => (
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
    </Box>
  );
}

export default function CorporateIndexPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="md">
          <Chip label="Corporate" size="small" sx={{ bgcolor: "#F7F6F2", fontWeight: 600, mb: 2 }} />
          <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 42 }, mb: 2 }}>
            Everything about the company
          </Typography>
          <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 6, maxWidth: 600 }}>
            About Commission, how to reach us, and the policies that govern using the platform.
          </Typography>

          <PageGroup label="Company" pages={COMPANY_PAGES} />
          <PageGroup label="Legal" pages={LEGAL_PAGES} />
        </Container>
      </Box>
    </MarketingPageShell>
  );
}
