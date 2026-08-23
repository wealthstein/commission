import Link from "next/link";
import { Box, Container, Typography, Grid, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";
import { withPeriod } from "@/lib/textFormat";
import { urls } from "@/lib/urls";
import { comparisons } from "@/lib/comparisons";
import { buildComparisonsIndexMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";

export const metadata = buildComparisonsIndexMetadata();

export default function ComparisonsIndexPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="md">
          <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 42 }, mb: 2 }}>
            {withPeriod("Commission vs every other marketing channel")}
          </Typography>
          <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 6, maxWidth: 640 }}>
            See how Commission compares on cost, speed, and risk against the channels businesses already spend on.
          </Typography>

          <Grid container spacing={2.5}>
            {comparisons.map((c) => (
              <Grid item xs={12} sm={6} key={c.slug}>
                <Box
                  component={Link}
                  href={urls.comparison(c.slug)}
                  sx={{
                    display: "block",
                    textDecoration: "none",
                    border: `1px solid ${tokens.border}`,
                    borderRadius: 3,
                    overflow: "hidden",
                    "&:hover": { borderColor: tokens.ink },
                  }}
                >
                  <Stack direction="row" alignItems="stretch" sx={{ position: "relative" }}>
                    <Box sx={{ flex: 1, bgcolor: tokens.ink, color: "#fff", p: 3 }}>
                      <Typography variant="caption" sx={{ opacity: 0.6, display: "block", mb: 0.5 }}>
                        PAY FOR
                      </Typography>
                      <Typography fontWeight={700}>Commission</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>
                        Intent Qualified Leads &amp; sales
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        bgcolor: tokens.brand,
                        color: tokens.brandInk,
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 800,
                        fontSize: 11,
                        border: `3px solid ${tokens.paper}`,
                      }}
                    >
                      VS
                    </Box>
                    <Box sx={{ flex: 1, p: 3 }}>
                      <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mb: 0.5 }}>
                        PAY FOR
                      </Typography>
                      <Typography fontWeight={700}>{c.channelName}</Typography>
                      <Typography variant="body2" sx={{ color: tokens.muted, mt: 0.5 }}>
                        Reach &amp; impressions
                      </Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ p: 3, borderTop: `1px solid ${tokens.border}` }}>
                    <Typography variant="body2" sx={{ color: tokens.muted }}>
                      {c.intro.slice(0, 130)}…
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </MarketingPageShell>
  );
}
