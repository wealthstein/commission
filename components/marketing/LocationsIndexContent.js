import Link from "next/link";
import { Container, Typography, Grid, Box, Stack, Chip } from "@mui/material";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import { tokens } from "@/lib/theme";

// Real Nigerian geopolitical zones - accurate, not invented.
const ZONES = {
  lagos: "South West",
  abuja: "North Central (FCT)",
  "port-harcourt": "South South",
  asaba: "South South",
  ibadan: "South West",
  enugu: "South East",
};

export default function LocationsIndexContent({ title, description, buildHref, items, relatedLinks }) {
  return (
    <Container maxWidth="md">
      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
        {title}
      </Typography>
      <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5, maxWidth: 640 }}>
        {description}
      </Typography>

      <Grid container spacing={1.5} sx={{ mb: relatedLinks?.length ? 6 : 0 }}>
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
                <LocationOnRoundedIcon sx={{ color: tokens.brandInk }} />
              </Box>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Typography fontWeight={700} sx={{ fontSize: 17 }}>
                    {item.name}
                  </Typography>
                  {ZONES[item.slug] && (
                    <Chip label={ZONES[item.slug]} size="small" sx={{ bgcolor: tokens.canvas, fontSize: 11, height: 20 }} />
                  )}
                </Stack>
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
