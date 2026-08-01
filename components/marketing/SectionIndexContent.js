import Link from "next/link";
import { Container, Typography, Grid, Paper, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";

export default function SectionIndexContent({ title, description, basePath, items, relatedLinks }) {
  return (
    <Container maxWidth="lg">
      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
        {title}
      </Typography>
      <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5, maxWidth: 640 }}>
        {description}
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: relatedLinks?.length ? 6 : 0 }}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.slug}>
            <Paper
              component={Link}
              href={`/${basePath}/${item.slug}`}
              variant="outlined"
              sx={{ display: "block", p: 3, borderRadius: 3, borderColor: tokens.border, height: "100%", "&:hover": { borderColor: tokens.ink } }}
            >
              <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                {item.name}
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.muted }}>
                {item.intro.slice(0, 100)}…
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {relatedLinks?.length > 0 && (
        <>
          <Typography variant="caption" fontWeight={700} sx={{ color: tokens.muted, display: "block", mb: 1.5 }}>
            RELATED
          </Typography>
          <Stack direction="row" spacing={3} flexWrap="wrap">
            {relatedLinks.map((link) => (
              <Typography key={link.href} component={Link} href={link.href} variant="body2" fontWeight={600} sx={{ color: tokens.ink }}>
                {link.label} →
              </Typography>
            ))}
          </Stack>
        </>
      )}
    </Container>
  );
}
