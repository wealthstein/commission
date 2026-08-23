import { Container, Typography, Box, Grid } from "@mui/material";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import { withPeriod } from "@/lib/textFormat";
import SignUpButton from "@/components/marketing/SignUpButton";

export default function CampaignPageContent({ item }) {
  return (
    <Container maxWidth="md">
      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
        {withPeriod(item.headline)}
      </Typography>
      <Typography variant="body1" sx={{ color: tokens.muted, mb: 4 }}>
        {item.intro}
      </Typography>

      <Box sx={{ border: `1px solid ${tokens.border}`, borderRadius: 3, overflow: "hidden", mb: 5 }}>
        {item.points.map((point, i) => (
          <Grid container key={point.title} sx={{ borderTop: i === 0 ? "none" : `1px solid ${tokens.border}`, px: 3, py: 2.5 }}>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" fontWeight={700} sx={{ color: tokens.muted }}>
                {point.title.toUpperCase()}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Typography variant="body2">{point.body}</Typography>
            </Grid>
          </Grid>
        ))}
      </Box>

      <SignUpButton role="business" sourcePage={urls.campaign(item.slug)} />

    </Container>
  );
}
