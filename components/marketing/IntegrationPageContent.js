import { Container, Typography, Box, Chip, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import { withPeriod } from "@/lib/textFormat";
import SignUpButton from "@/components/marketing/SignUpButton";

export default function IntegrationPageContent({ item }) {
  return (
    <Container maxWidth="md">
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
        <Chip
          label="Native integration"
          size="small"
          sx={{ bgcolor: "#E7F5EE", color: tokens.success, fontWeight: 700 }}
        />
      </Stack>

      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
        {withPeriod(item.headline)}
      </Typography>
      <Typography variant="body1" sx={{ color: tokens.muted, mb: 4 }}>
        {item.intro}
      </Typography>

      <Box sx={{ borderRadius: 3, bgcolor: tokens.ink, color: "#fff", p: 3, mb: 5 }}>
        {item.points.map((point, i) => (
          <Box key={point.title} sx={{ py: 1.5, borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.12)" }}>
            <Typography fontWeight={700} sx={{ mb: 0.25 }}>
              {point.title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.75 }}>
              {point.body}
            </Typography>
          </Box>
        ))}
      </Box>

      <SignUpButton role="business" sourcePage={urls.integration(item.slug)} />

    </Container>
  );
}
