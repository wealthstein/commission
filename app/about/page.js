import { Box, Container, Typography } from "@mui/material";
import { tokens } from "@/lib/theme";

export const metadata = {
  title: "About Commission | Commission",
  description: "Commission is a Nigerian affiliate marketplace connecting businesses with affiliates who earn commission on qualified leads and sales.",
};

export default function AboutPage() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="sm">
        <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 42 }, mb: 3 }}>
          About Commission
        </Typography>
        <Typography variant="body1" sx={{ color: tokens.muted, mb: 2 }}>
          Commission is a Nigerian affiliate marketplace. Businesses list a campaign, set what they are willing to
          pay for a qualified lead or a verified sale, and affiliates share a unique referral link to earn a tracked
          commission when it converts.
        </Typography>
        <Typography variant="body1" sx={{ color: tokens.muted }}>
          We are not fully open yet - request early access from any program or industry page and we will reach out
          the moment your account is ready.
        </Typography>
      </Container>
    </Box>
  );
}
