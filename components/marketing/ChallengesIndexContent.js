import Link from "next/link";
import { Container, Typography, Grid, Box } from "@mui/material";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import { tokens } from "@/lib/theme";

export default function ChallengesIndexContent({ title, description, buildHref, items, relatedLinks }) {
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
          <Grid item xs={12} sm={6} key={item.slug}>
            <Box
              component={Link}
              href={buildHref(item.slug)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 3,
                border: `1px solid ${tokens.border}`,
                borderRadius: 3,
                textDecoration: "none",
                color: "inherit",
                height: "100%",
                "&:hover": { borderColor: tokens.ink },
              }}
            >
              <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: tokens.brand, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <ReportProblemRoundedIcon sx={{ color: tokens.brandInk }} />
              </Box>
              <Box>
                <Typography fontWeight={700} sx={{ fontSize: 17, mb: 0.5 }}>
                  {item.name}
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.muted }}>
                  {item.headline}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {relatedLinks?.length > 0 && (
        <>
          <Typography variant="caption" fontWeight={700} sx={{ color: tokens.muted, display: "block", mb: 1.5 }}>
            RELATED
          </Typography>
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {relatedLinks.map((link) => (
              <Typography key={link.href} component={Link} href={link.href} variant="body2" fontWeight={600} sx={{ color: tokens.ink }}>
                {link.label} →
              </Typography>
            ))}
          </Box>
        </>
      )}
    </Container>
  );
}
