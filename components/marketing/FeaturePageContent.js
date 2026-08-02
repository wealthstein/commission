import { Container, Typography, Box, Stack } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import SignUpButton from "@/components/marketing/SignUpButton";

export default function FeaturePageContent({ item }) {
  return (
    <Container maxWidth="lg">
      <Box sx={{ width: 56, height: 56, borderRadius: "16px", bgcolor: tokens.brand, display: "grid", placeItems: "center", mb: 3 }}>
        <BoltRoundedIcon sx={{ color: tokens.brandInk }} />
      </Box>

      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
        {item.headline}
      </Typography>
      <Typography variant="body1" sx={{ color: tokens.muted, mb: 4, maxWidth: 520 }}>
        {item.intro}
      </Typography>

      <Stack spacing={2} sx={{ mb: 5 }}>
        {item.points.map((point) => (
          <Stack key={point.title} direction="row" spacing={1.5} alignItems="flex-start">
            <CheckCircleRoundedIcon sx={{ color: tokens.success, fontSize: 20, mt: 0.3, flexShrink: 0 }} />
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 700, color: tokens.ink }}>
                {point.title}.{" "}
              </Box>
              <Box component="span" sx={{ color: tokens.muted }}>
                {point.body}
              </Box>
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Box sx={{ mb: 5 }}>
        <SignUpButton role="business" sourcePage={urls.feature(item.slug)} />
      </Box>

    </Container>
  );
}
