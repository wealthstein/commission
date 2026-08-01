import { Box, Container, Typography, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";

export const metadata = {
  title: "Terms of Service | Commission",
  description: "Terms governing use of Commission by businesses and affiliates.",
};

export default function TermsPage() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="sm">
        <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 38 }, mb: 3 }}>
          Terms of Service
        </Typography>
        <Stack spacing={2.5}>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            This is a placeholder summary, not a complete legal document. A full Terms of Service will be published
            before Commission opens for general use.
          </Typography>
          <Typography variant="body1">
            Commission connects businesses running campaigns with affiliates who promote them, and calculates and
            facilitates commission payouts. Businesses are responsible for the products and services they list.
            Affiliates are responsible for how they promote a campaign and must not make claims a business has not
            authorized.
          </Typography>
          <Typography variant="body1">
            Amounts on the platform are in Nigerian Naira. Payments are processed through Paystack, subject to
            Paystack's own terms.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
