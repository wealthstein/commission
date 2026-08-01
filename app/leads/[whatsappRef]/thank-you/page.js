import { Box, Container, Typography } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { tokens } from "@/lib/theme";

export default function ThankYouPage() {
  return (
    <Box sx={{ py: { xs: 10, md: 14 } }}>
      <Container maxWidth="sm" sx={{ textAlign: "center" }}>
        <CheckCircleRoundedIcon sx={{ fontSize: 56, color: tokens.success, mb: 2 }} />
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1.5 }}>
          Thanks - you are all set
        </Typography>
        <Typography variant="body1" sx={{ color: tokens.muted }}>
          The business has your details and will be in touch shortly, either here or on WhatsApp.
        </Typography>
      </Container>
    </Box>
  );
}
