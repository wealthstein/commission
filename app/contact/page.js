import { Box, Container, Typography, Button } from "@mui/material";
import { tokens } from "@/lib/theme";
import { withPeriod } from "@/lib/textFormat";

export const metadata = {
  title: "Contact Commission | Commission",
  description: "Get in touch with the Commission team.",
};

export default function ContactPage() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="sm">
        <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 42 }, mb: 3 }}>
          {withPeriod("Contact us")}
        </Typography>
        <Typography variant="body1" sx={{ color: tokens.muted, mb: 3 }}>
          Reach the Commission team directly by email, or request early access from any program or industry page.
        </Typography>
        <Button variant="contained" size="large" href="mailto:hello@commission.ng">
          Email hello@commission.ng
        </Button>
      </Container>
    </Box>
  );
}
