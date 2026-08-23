import { Box, Container, Typography, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";
import { withPeriod } from "@/lib/textFormat";

export const metadata = {
  title: "Privacy Policy | Commission",
  description: "How Commission handles data for businesses, affiliates, and leads.",
};

export default function PrivacyPage() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="sm">
        <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 38 }, mb: 3 }}>
          {withPeriod("Privacy Policy")}
        </Typography>
        <Stack spacing={2.5}>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            This is a placeholder summary, not a complete legal document. A full Privacy Policy will be published
            before Commission opens for general use.
          </Typography>
          <Typography variant="body1">
            Commission stores account information for businesses and affiliates - name, email, phone, and payout
            details.
          </Typography>
          <Typography variant="body1">
            Commission deliberately does not store a lead's identity. A prospect's name, phone, email, and any
            answers they give are forwarded directly to the business running that campaign - by email or by a
            webhook the business controls - and are not kept in Commission's own database. See the Integrations
            pages for how that forwarding works.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
