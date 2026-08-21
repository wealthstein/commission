import Link from "next/link";
import { Container, Typography, Grid, Paper, Stack, Chip, Box } from "@mui/material";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import SignUpButton from "@/components/marketing/SignUpButton";
import { DEFAULT_PPQL_NAIRA } from "@/lib/industryPages";

export default function IndustryLandingContent({ industryPage }) {
  const ppql = industryPage.ppqlNaira || DEFAULT_PPQL_NAIRA;

  return (
    <Container maxWidth="md">
      <Chip label={industryPage.industryName} size="small" sx={{ bgcolor: "#F7F6F2", fontWeight: 600, mb: 2 }} />

      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
        {industryPage.headline}
      </Typography>

      <Typography variant="body2" sx={{ color: tokens.muted, mb: 4, maxWidth: 640 }}>
        Businesses in {industryPage.industryName.toLowerCase()} typically pay around{" "}
        <strong>₦{ppql.toLocaleString()} per Intent Qualified Lead</strong> on
        Commission - you set your own amount when you list a campaign.
      </Typography>

      {/* Real numbers only - the typical PPQL you already set per industry,
          and the platform-wide tier structure. No fabricated affiliate or
          business counts, since that data does not exist honestly yet. */}
      <Stack direction={{ xs: "column", sm: "row" }} sx={{ borderRadius: 3, overflow: "hidden", mb: 5 }}>
        <Box sx={{ flex: 1, bgcolor: tokens.ink, color: "#fff", p: 3 }}>
          <Typography variant="h4" fontWeight={700}>
            ₦{ppql.toLocaleString()}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            typical cost per Intent Qualified Lead in {industryPage.industryName.toLowerCase()}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, bgcolor: tokens.brand, p: 3 }}>
          <Typography variant="h4" fontWeight={700} sx={{ color: tokens.brandInk }}>
            3 tiers
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.brandInk, opacity: 0.85 }}>
            of affiliates can promote your campaign, up to 2 levels deep
          </Typography>
        </Box>
        <Box sx={{ flex: 1, bgcolor: "#F7F6F2", p: 3 }}>
          <Typography component={Link} href={urls.calculator("business")} variant="h4" fontWeight={700} sx={{ display: "block", color: tokens.ink }}>
            Calculate →
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            see exactly what a campaign could cost
          </Typography>
        </Box>
      </Stack>

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
      <Grid container spacing={1.5} sx={{ mb: 5 }}>
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

      {industryPage.payoutModel && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
            {industryPage.payoutModel.title}
          </Typography>
          <Stack spacing={2}>
            {industryPage.payoutModel.stages.map((stage, i) => {
              const StageIcon = i === 0 ? BoltRoundedIcon : HandshakeRoundedIcon;
              return (
                <Paper key={stage.title} variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, display: "flex", gap: 2, alignItems: "flex-start" }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      bgcolor: tokens.brand,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <StageIcon sx={{ color: tokens.brandInk, fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                      {stage.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: tokens.muted }}>
                      {stage.description}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        </Box>
      )}

      <Paper sx={{ bgcolor: tokens.ink, color: "#fff", borderRadius: 4, p: { xs: 3, md: 4 }, mb: 5 }}>
        <Typography variant="overline" sx={{ color: tokens.brand, letterSpacing: 1.2 }}>
          In practice
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.6 }}>
          {industryPage.exampleUseCase}
        </Typography>
      </Paper>

      <SignUpButton role="business" sourcePage={urls.industry(industryPage.slug)} />

    </Container>
  );
}
