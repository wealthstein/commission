import { Container, Typography, Grid, Paper, Stack, Chip, Box } from "@mui/material";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import RequestAccountForm from "@/components/marketing/RequestAccountForm";
import { DEFAULT_PPQL_NAIRA } from "@/lib/industryPages";

export default function IndustryLandingContent({ industryPage }) {
  return (
    <Container maxWidth="lg">
      <Chip label={industryPage.industryName} size="small" sx={{ bgcolor: "#F1EFE7", fontWeight: 600, mb: 2 }} />

      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
        {industryPage.headline}
      </Typography>

      <Typography variant="body2" sx={{ color: tokens.muted, mb: 2, maxWidth: 640 }}>
        Businesses in {industryPage.industryName.toLowerCase()} typically pay around{" "}
        <strong>₦{(industryPage.ppqlNaira || DEFAULT_PPQL_NAIRA).toLocaleString()} per qualified lead</strong> on
        Commission - you set your own amount when you list a campaign.
      </Typography>

      <Stack spacing={1} sx={{ mb: 5, maxWidth: 640 }}>
        {industryPage.painPoints.map((p) => (
          <Typography key={p} variant="body1" sx={{ color: tokens.muted }}>
            · {p}
          </Typography>
        ))}
      </Stack>

      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Why {industryPage.industryName} businesses use Commission
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 5 }}>
        {industryPage.whyCommission.map((item) => (
          <Grid item xs={12} sm={6} key={item.title}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, height: "100%" }}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                {item.title}
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.muted }}>
                {item.body}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ bgcolor: tokens.ink, color: "#fff", borderRadius: 4, p: { xs: 3, md: 4 }, mb: 5 }}>
        <Typography variant="overline" sx={{ color: tokens.brand, letterSpacing: 1.2 }}>
          In practice
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.6 }}>
          {industryPage.exampleUseCase}
        </Typography>
      </Paper>

      <Box sx={{ mb: 5 }}>
        <RequestAccountForm sourcePage={urls.industry(industryPage.slug)} fixedRole="business" />
      </Box>

    </Container>
  );
}
