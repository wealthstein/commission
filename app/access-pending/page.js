import { Box, Container, Typography, Stack } from "@mui/material";
import CardMedia from "@mui/material/CardMedia";
import { tokens } from "@/lib/theme";

export const metadata = {
  title: "You're registered | Commission",
  description: "Your Commission account is registered - dashboard access is granted on a rolling basis.",
};

export default function AccessPendingPage() {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", py: 8 }}>
      <Container maxWidth="sm" sx={{ textAlign: "center" }}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 5 }}>
          <CardMedia sx={{ height: 28, width: 28, borderRadius: "8px" }} image="/circle.svg" alt="Commission" />
          <Typography fontWeight={700} sx={{ fontSize: 18 }}>
            Commission
          </Typography>
        </Stack>

        <Typography variant="h4" fontWeight={700} sx={{ mb: 1.5 }}>
          You&apos;re registered
        </Typography>
        <Typography variant="body1" sx={{ color: tokens.muted, mb: 1 }}>
          Your account is set up with Google - dashboard access is being granted on a rolling basis as Commission
          opens up. We will email you the moment yours is ready.
        </Typography>
        <Typography variant="body2" sx={{ color: tokens.muted }}>
          No need to sign up again - the same Google account will take you straight into your dashboard once access
          is granted.
        </Typography>
      </Container>
    </Box>
  );
}
