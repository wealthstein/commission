import { Box, Container, Typography, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";
import { withPeriod } from "@/lib/textFormat";

export const metadata = {
  title: "Security | Commission",
  description: "How Commission approaches data security and payment handling.",
};

export default function SecurityPage() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="sm">
        <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 38 }, mb: 3 }}>
          {withPeriod("Security")}
        </Typography>
        <Stack spacing={2.5}>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            A summary of how Commission is built, not a formal security audit or certification.
          </Typography>
          <Typography variant="body1">
            Payments are processed through Paystack - Commission never handles raw card details directly. Row-level
            security policies restrict businesses and affiliates to their own data.
          </Typography>
          <Typography variant="body1">
            Lead identity data (name, phone, email) is deliberately never stored in Commission's own database - it
            is forwarded straight to the business that owns the campaign and discarded from Commission's side. See
            the Privacy page for more detail.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
