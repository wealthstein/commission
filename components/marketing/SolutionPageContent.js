import { Container, Typography, Box, Stack } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import SignUpButton from "@/components/marketing/SignUpButton";

const STAGE_LABELS = ["The problem", "How Commission helps", "The outcome"];

export default function SolutionPageContent({ item }) {
  const stages = item.points.slice(0, 3);

  return (
    <Container maxWidth="lg">
      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
        {item.headline}
      </Typography>
      <Typography variant="body1" sx={{ color: tokens.muted, mb: 5, maxWidth: 640 }}>
        {item.intro}
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch" sx={{ mb: 5 }}>
        {stages.map((point, i) => (
          <Stack key={point.title} direction={{ xs: "row", md: "column" }} spacing={2} alignItems="center" sx={{ flex: 1 }}>
            <Box
              sx={{
                flex: 1,
                width: "100%",
                p: 3,
                borderRadius: 3,
                border: `1px solid ${tokens.border}`,
                bgcolor: i === 1 ? tokens.brand : tokens.paper,
              }}
            >
              <Typography variant="caption" fontWeight={700} sx={{ color: i === 1 ? tokens.brandInk : tokens.muted, display: "block", mb: 1 }}>
                {STAGE_LABELS[i]?.toUpperCase()}
              </Typography>
              <Typography fontWeight={700} sx={{ color: i === 1 ? tokens.brandInk : tokens.ink, mb: 0.5 }}>
                {point.title}
              </Typography>
              <Typography variant="body2" sx={{ color: i === 1 ? tokens.brandInk : tokens.muted, opacity: i === 1 ? 0.85 : 1 }}>
                {point.body}
              </Typography>
            </Box>
            {i < stages.length - 1 && (
              <ArrowForwardRoundedIcon sx={{ color: tokens.muted, transform: { xs: "none", md: "rotate(90deg)" }, flexShrink: 0 }} />
            )}
          </Stack>
        ))}
      </Stack>

      <SignUpButton role="business" sourcePage={urls.solution(item.slug)} />

    </Container>
  );
}
