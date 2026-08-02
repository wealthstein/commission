import Link from "next/link";
import { Container, Typography, Grid, Box, Stack } from "@mui/material";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import { tokens } from "@/lib/theme";

const ICONS = {
  "lead-tracking": TrackChangesRoundedIcon,
  "multi-tier-payout": AccountTreeRoundedIcon,
  "affiliate-tracking": GroupsRoundedIcon,
  "data-analytics": BarChartRoundedIcon,
  "campaign-wallet": AccountBalanceWalletRoundedIcon,
  "custom-branding": PaletteRoundedIcon,
};

function FeatureTile({ item, featured }) {
  const Icon = ICONS[item.slug] || TrackChangesRoundedIcon;
  return (
    <Box
      component={Link}
      href={`/features/${item.slug}`}
      sx={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        border: `1px solid ${tokens.border}`,
        borderRadius: 3,
        p: featured ? 4 : 3,
        height: "100%",
        bgcolor: featured ? tokens.ink : tokens.paper,
        "&:hover": { borderColor: tokens.ink },
      }}
    >
      <Box
        sx={{
          width: featured ? 48 : 40,
          height: featured ? 48 : 40,
          borderRadius: "12px",
          bgcolor: featured ? tokens.brand : "#F1EFE7",
          display: "grid",
          placeItems: "center",
          mb: 2,
        }}
      >
        <Icon sx={{ color: featured ? tokens.brandInk : tokens.ink, fontSize: featured ? 26 : 22 }} />
      </Box>
      <Typography fontWeight={700} sx={{ mb: 0.75, color: featured ? "#fff" : tokens.ink, fontSize: featured ? 20 : 16 }}>
        {item.name}
      </Typography>
      <Typography variant="body2" sx={{ color: featured ? "rgba(255,255,255,0.75)" : tokens.muted }}>
        {item.headline}
      </Typography>
    </Box>
  );
}

export default function FeaturesIndexContent({ title, description, items, relatedLinks }) {
  const [first, ...rest] = items;

  return (
    <Container maxWidth="lg">
      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
        {title}
      </Typography>
      <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5, maxWidth: 640 }}>
        {description}
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: relatedLinks?.length ? 6 : 0 }}>
        <Grid item xs={12} md={6}>
          <FeatureTile item={first} featured />
        </Grid>
        <Grid item xs={12} md={6}>
          <Grid container spacing={2.5} sx={{ height: "100%" }}>
            {rest.slice(0, 2).map((item) => (
              <Grid item xs={12} sm={6} key={item.slug}>
                <FeatureTile item={item} />
              </Grid>
            ))}
          </Grid>
        </Grid>
        {rest.slice(2).map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.slug}>
            <FeatureTile item={item} />
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
