import { Container, Typography, Grid, Paper, Box } from "@mui/material";
import { tokens } from "@/lib/theme";
import { withPeriod } from "@/lib/textFormat";
import RequestAccountForm from "@/components/marketing/RequestAccountForm";

export default function SectionPageContent({ item, sourcePage }) {
  return (
    <Container maxWidth="md">
      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
        {withPeriod(item.headline)}
      </Typography>

      <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5 }}>
        {item.intro}
      </Typography>

      <Grid container spacing={1.5} sx={{ mb: 5 }}>
        {item.points.map((point) => (
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

      <Box sx={{ mb: 5 }}>
        <RequestAccountForm sourcePage={sourcePage} />
      </Box>

    </Container>
  );
}
