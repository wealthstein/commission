import Link from "next/link";
import { Box, Container, Typography, Grid, Paper, Chip } from "@mui/material";
import { tokens } from "@/lib/theme";
import { listPrograms } from "@/lib/programs";
import { buildProgramsIndexMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";

export const revalidate = 3600;
export const metadata = buildProgramsIndexMetadata();

export default async function ProgramsIndexPage() {
  const programs = await listPrograms();

  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg">
          <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
            Programs on Commission
          </Typography>
          <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5, maxWidth: 640 }}>
            Browse every business and industry program tracked on Commission, live or upcoming.
          </Typography>

          <Grid container spacing={2.5}>
            {programs.map((p) => (
              <Grid item xs={12} sm={6} md={4} key={p.route_slug}>
                <Paper
                  component={Link}
                  href={`/programs/${p.route_slug}`}
                  variant="outlined"
                  sx={{ display: "block", p: 3, borderRadius: 3, borderColor: tokens.border, height: "100%", "&:hover": { borderColor: tokens.ink } }}
                >
                  <Chip
                    label={p.type === "company" ? "Company" : "Industry"}
                    size="small"
                    sx={{ bgcolor: "#F1EFE7", fontWeight: 600, mb: 1.5 }}
                  />
                  <Typography fontWeight={700}>{p.display_name}</Typography>
                </Paper>
              </Grid>
            ))}
            {programs.length === 0 && (
              <Typography sx={{ color: tokens.muted, px: 1 }}>
                No programs seeded yet - see supabase/seed_seo_targets.sql.
              </Typography>
            )}
          </Grid>
        </Container>
      </Box>
    </MarketingPageShell>
  );
}
