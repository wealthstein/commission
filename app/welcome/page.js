import { Box, Container, Typography, Stack, Button, Avatar } from "@mui/material";
import CardMedia from "@mui/material/CardMedia";
import { tokens } from "@/lib/theme";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export const metadata = {
  title: "Welcome to Commission | Commission",
  description: "Your Commission account is set up and under review.",
};

function firstNameFrom(user) {
  const given = user?.user_metadata?.given_name;
  if (given) return given;
  const fullName = user?.user_metadata?.full_name;
  if (fullName) return fullName.split(" ")[0];
  return "there";
}

export default async function WelcomePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const firstName = firstNameFrom(user);
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", py: 8 }}>
      <Container maxWidth="lg" sx={{ textAlign: "center" }}>
        <Avatar src={avatarUrl} sx={{ width: 72, height: 72, mx: "auto", mb: 3, bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700 }}>
          {firstName.charAt(0).toUpperCase()}
        </Avatar>

        <Typography variant="h4" fontWeight={700} sx={{ mb: 1.5 }}>
          Hi, {firstName}!
        </Typography>
        <Typography variant="body1" sx={{ color: tokens.muted, mb: 1, maxWidth: 440, mx: "auto" }}>
          Thank you for your interest in joining Commission. We are currently reviewing your account and will
          contact you soon regarding next steps.
        </Typography>

        <Stack alignItems="center" spacing={4} sx={{ mt: 4 }}>
          <Button variant="contained" size="large" href="/">
            Back to Commission
          </Button>

          <CardMedia sx={{ height: 28, width: 28, borderRadius: "8px" }} image="/circle.svg" alt="Commission" />
        </Stack>
      </Container>
    </Box>
  );
}
