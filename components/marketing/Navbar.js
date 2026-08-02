"use client";

import Link from "next/link";
import { AppBar, Toolbar, Box, CardMedia, Typography, Button, ToggleButtonGroup, ToggleButton, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";

const NAV_LINKS = [
  { anchor: "benefits", label: "Benefits" },
  { anchor: "how-it-works", label: "How it works" },
  { anchor: "pricing", label: "Pricing", businessOnly: true },
  { anchor: "faq", label: "FAQ" },
];


export default function Navbar({ audience, onAudienceChange, onSignIn }) {
  const links = NAV_LINKS.filter((link) => !link.businessOnly || audience === "business");

  // Off the homepage, a bare "#benefits" href resolves against the CURRENT
  // path (e.g. /industries/fintech#benefits, which goes nowhere real).
  // Prefixing with "/" makes it an absolute path + hash - Next.js Link
  // navigates to "/" first and then scrolls to the section, from any page.
  function hrefFor(anchor) {
    return `/#${anchor}`;
  }

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: "rgba(250,249,245,0.85)", backdropFilter: "blur(8px)" }}>
      <Toolbar sx={{ maxWidth: 1060, mx: "auto", width: "100%", py: 1.25, px: { xs: 3, sm: 5, md: 8, lg: 10 }, gap: 3 }}>
        <Stack component={Link} href="/" direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0, textDecoration: "none" }}>
          <Box style={{ display: "flex", justifyContent: "center" }}>
            <CardMedia
              sx={{ height: 28, width: 28, borderRadius: "4px" }}
              image={`/circle.svg`}
              alt="detail"
            />
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={3}
          sx={{ display: { xs: "none", md: "flex" }, flexGrow: 1 }}
        >
          {links.map((link) => (
            <Typography
              key={link.anchor}
              component={Link}
              href={hrefFor(link.anchor)}
              variant="body2"
              sx={{ color: tokens.muted, fontWeight: 600, "&:hover": { color: tokens.ink } }}
            >
              {link.label}
            </Typography>
          ))}
        </Stack>

        <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />

        <ToggleButtonGroup
          value={audience}
          exclusive
          size="small"
          onChange={(_, val) => val && onAudienceChange(val)}
          sx={{
            bgcolor: "#F1EFE7",
            borderRadius: 999,
            p: 0.4,
            "& .MuiToggleButton-root": {
              border: "none",
              borderRadius: 999,
              px: 1.75,
              py: 0.5,
              textTransform: "none",
              fontWeight: 600,
              fontSize: 13,
              color: tokens.muted,
            },
            "& .Mui-selected": {
              bgcolor: `${tokens.paper} !important`,
              color: `${tokens.ink} !important`,
            },
          }}
        >
          <ToggleButton value="business">Business</ToggleButton>
          <ToggleButton value="affiliate">Affiliate</ToggleButton>
        </ToggleButtonGroup>

        {/* Routes to the sign-in page - if this Google account has no
            existing row, the callback bounces to /signup instead (see
            app/api/auth/callback). No more scroll-to-form behavior. */}
        <Button
          variant="contained"
          component={Link}
          href="/signin"
          sx={{ display: { xs: "none", sm: "inline-flex" } }}
        >
          Get started
        </Button>
      </Toolbar>
    </AppBar>
  );
}
