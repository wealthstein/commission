import { Container, Typography, Grid, Paper, Box } from "@mui/material";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import SignUpButton from "@/components/marketing/SignUpButton";

export default function ComparisonPageContent({ comparison }) {
  return (
    <Container maxWidth="lg">
      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
        {comparison.headline}
      </Typography>

      <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5, maxWidth: 640 }}>
        {comparison.intro}
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 5 }}>
        {comparison.points.map((point) => (
          <Grid item xs={12} sm={6} key={point.title}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, height: "100%" }}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                {point.title}
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.muted }}>
                {point.body}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <SignUpButton role="business" sourcePage={urls.comparison(comparison.slug)} />

    </Container>
  );
}
