import { Box, Container, Typography } from "@mui/material";
import { tokens } from "@/lib/theme";

export const metadata = {
  title: "Careers at Commission | Commission",
  description: "Commission is not currently hiring for open roles - check back soon.",
};

export default function CareersPage() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="sm">
        <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 42 }, mb: 3 }}>
          Careers
        </Typography>
        <Typography variant="body1" sx={{ color: tokens.muted }}>
          Commission is a small, early-stage team. We do not have open roles listed right now, but if you would like
          to be considered when we do, reach out at hello@commission.ng.
        </Typography>
      </Container>
    </Box>
  );
}
