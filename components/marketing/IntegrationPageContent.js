import { Container, Typography, Box, Chip, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";
import RequestAccountForm from "@/components/marketing/RequestAccountForm";

const NATIVE_SLUGS = ["whatsapp", "email"];

export default function IntegrationPageContent({ item }) {
  const isNative = NATIVE_SLUGS.includes(item.slug);
  const isApiItself = item.slug === "api";

  return (
    <Container maxWidth="lg">
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
        <Chip
          label={isNative ? "Native integration" : "Via API"}
          size="small"
          sx={{
            bgcolor: isNative ? "#E7F5EE" : "#FFF3C4",
            color: isNative ? tokens.success : tokens.brandInk,
            fontWeight: 700,
          }}
        />
        {isApiItself && <Chip label="Premium feature" size="small" sx={{ bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700 }} />}
        {!isNative && !isApiItself && <Chip label="Requires API access" size="small" variant="outlined" />}
      </Stack>

      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
        {item.headline}
      </Typography>
      <Typography variant="body1" sx={{ color: tokens.muted, mb: 4, maxWidth: 520 }}>
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

      <Box sx={{ mb: 5 }}>
        <RequestAccountForm sourcePage={`/integrations/${item.slug}`} />
      </Box>

    </Container>
  );
}
