import { Container, Typography, Stack, Box } from "@mui/material";
import { tokens } from "@/lib/theme";
import RequestAccountForm from "@/components/marketing/RequestAccountForm";

export default function ConversionPageContent({ item }) {
  return (
    <Container maxWidth="lg">
      <Typography variant="overline" sx={{ color: tokens.muted, letterSpacing: 1.2 }}>
        CONVERSION GOAL
      </Typography>
      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mt: 1, mb: 2 }}>
        {item.headline}
      </Typography>
      <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5 }}>
        {item.intro}
      </Typography>

      <Stack spacing={0} sx={{ mb: 5 }}>
        {item.points.map((point, i) => (
          <Stack key={point.title} direction="row" spacing={3} sx={{ py: 3, borderTop: i === 0 ? "none" : `1px solid ${tokens.border}` }}>
            <Typography variant="h4" sx={{ color: tokens.brand, WebkitTextStroke: `1.5px ${tokens.ink}`, minWidth: 48, fontSize: 32 }}>
              {String(i + 1).padStart(2, "0")}
            </Typography>
            <Box>
              <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                {point.title}
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.muted }}>
                {point.body}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>

      <Box sx={{ mb: 5 }}>
        <RequestAccountForm sourcePage={`/conversions/${item.slug}`} />
      </Box>

    </Container>
  );
}
