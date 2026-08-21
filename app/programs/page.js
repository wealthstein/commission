import Link from "next/link";
import { Box, Container, Typography, Grid } from "@mui/material";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import { listPrograms } from "@/lib/programs";
import { buildProgramsIndexMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import SignUpButton from "@/components/marketing/SignUpButton";

export const revalidate = 3600;
export const metadata = buildProgramsIndexMetadata();

// Alternating tile colors so the grid reads as distinct from the plain
// white-bordered card pattern used on every other index page.
const TILE_STYLES = [
  { bg: tokens.ink, fg: "#fff" },
  { bg: tokens.brand, fg: tokens.brandInk },
  { bg: "#F7F6F2", fg: tokens.ink },
];

export default async function ProgramsIndexPage() {
  const industries = (await listPrograms()).filter((p) => p.type === "industry");

  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="md">
          <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 42 }, mb: 2, maxWidth: 640 }}>
            Find a program worth promoting
          </Typography>
          <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 6, maxWidth: 600 }}>
            Every industry below is a real, tracked opportunity - share a link, earn a commission automatically,
            no application required.
          </Typography>

          <Grid container spacing={2}>
            {industries.map((p, i) => {
              const style = TILE_STYLES[i % TILE_STYLES.length];
              return (
                <Grid item xs={12} sm={6} md={4} key={p.route_slug}>
                  <Box
                    component={Link}
                    href={urls.program(p.route_slug)}
                    sx={{
                      display: "block",
                      textDecoration: "none",
                      bgcolor: style.bg,
                      color: style.fg,
                      borderRadius: 4,
                      p: 4,
                      height: 160,
                      position: "relative",
                      overflow: "hidden",
                      transition: "transform 160ms ease",
                      "&:hover": { transform: "translateY(-4px)" },
                    }}
                  >
                    <Typography variant="h5" fontWeight={700}>
                      {p.display_name}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>
                      Promote {p.display_name.toLowerCase()} programs →
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          {industries.length === 0 && (
            <Typography sx={{ color: tokens.muted, mb: 6 }}>
              No industries seeded yet - see supabase/seed_seo_targets.sql.
            </Typography>
          )}

          <Box sx={{ maxWidth: 480, mx: "auto", mt: 7 }}>
            <SignUpButton role="affiliate" sourcePage={urls.programsIndex()} />
          </Box>
        </Container>
      </Box>
    </MarketingPageShell>
  );
}
