import { Container, Typography, Box, Grid } from "@mui/material";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import RequestAccountForm from "@/components/marketing/RequestAccountForm";

export default function CampaignPageContent({ item }) {
  return (
    <Container maxWidth="lg">
      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
        {item.headline}
      </Typography>
      <Typography variant="body1" sx={{ color: tokens.muted, mb: 4, maxWidth: 520 }}>
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

      <Box sx={{ mb: 5 }}>
        <RequestAccountForm sourcePage={urls.campaign(item.slug)} fixedRole="business" />
      </Box>

    </Container>
  );
}
