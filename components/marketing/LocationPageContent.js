import { Container, Typography, Box, Stack, Chip } from "@mui/material";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import SignUpButton from "@/components/marketing/SignUpButton";

export default function LocationPageContent({ item }) {
  return (
    <Container maxWidth="lg">
      <Chip
        icon={<LocationOnRoundedIcon sx={{ fontSize: 16 }} />}
        label="Nigeria"
        size="small"
        sx={{ bgcolor: "#F1EFE7", fontWeight: 600, mb: 2 }}
      />
      <Typography variant="h1" sx={{ fontSize: { xs: 32, md: 48 }, mb: 2 }}>
        {item.name}
      </Typography>
      <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 4, maxWidth: 520 }}>
        {item.intro}
      </Typography>

      <Box sx={{ borderLeft: `3px solid ${tokens.brand}`, pl: 3, mb: 5 }}>
        <Typography variant="body1" fontWeight={600}>
          {item.headline}
        </Typography>
      </Box>

      <Stack spacing={2.5} sx={{ mb: 5 }}>
        {item.points.map((point) => (
          <Stack key={point.title} direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: tokens.ink, mt: 1, flexShrink: 0 }} />
            <Box>
              <Typography fontWeight={700}>{point.title}</Typography>
              <Typography variant="body2" sx={{ color: tokens.muted }}>
                {point.body}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>

      <Box sx={{ mb: 5 }}>
        <SignUpButton role="business" sourcePage={urls.location(item.slug)} />
      </Box>

    </Container>
  );
}
