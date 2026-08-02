import Link from "next/link";
import { Box, Container, Grid, Typography, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";
import { buildInternalLinkColumns } from "@/lib/internalLinks";
import { listPrograms } from "@/lib/programs";
import { urls } from "@/lib/urls";

export default async function InternalLinksSection() {
  let programLinks = [];
  try {
    const programs = await listPrograms();
    programLinks = programs.map((p) => ({ label: p.display_name, href: urls.program(p.route_slug) }));
  } catch {
    // If Supabase is not configured yet in local dev, the static columns still render fine.
  }

  const columns = buildInternalLinkColumns({ programLinks });

  return (
    <Box
      component="nav"
      aria-label="More on Commission"
      sx={{
        display: { xs: "none", md: "block" }, // hidden on small screens, footer still shows
        py: 6,
        bgcolor: tokens.canvas,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {columns.map((column) => (
            <Grid item xs={6} sm={4} md={2} key={column.title}>
              <Typography
                component={Link}
                href={column.indexHref}
                variant="caption"
                fontWeight={700}
                sx={{ color: tokens.muted, display: "block", mb: 1.25, fontSize: 11, "&:hover": { color: tokens.ink } }}
              >
                {column.title.toUpperCase()}
              </Typography>
              <Stack spacing={0.75}>
                {column.links.map((link) => (
                  <Typography
                    key={link.href}
                    component={Link}
                    href={link.href}
                    sx={{ color: tokens.ink, fontSize: 11, "&:hover": { color: tokens.muted } }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
