import Link from "next/link";
import { Container, Typography, Grid, Paper, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";
import { withPeriod } from "@/lib/textFormat";

export default function SectionIndexContent({ title, description, buildHref, items }) {
  return (
    <Container maxWidth="md">
      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
        {withPeriod(title)}
      </Typography>
      <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5, maxWidth: 640 }}>
        {description}
      </Typography>

      <Grid container spacing={1.5}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.slug}>
            <Paper
              component={Link}
              href={buildHref(item.slug)}
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
    </Container>
  );
}
