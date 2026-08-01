"use client";

import Link from "next/link";
import { AppBar, Toolbar, Box, CardMedia, Typography, Button, ToggleButtonGroup, ToggleButton, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";

const NAV_LINKS = [
  { href: "#benefits", label: "Benefits" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing", businessOnly: true },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar({ audience, onAudienceChange, onSignIn }) {
  const links = NAV_LINKS.filter((link) => !link.businessOnly || audience === "business");
  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: "rgba(250,249,245,0.85)", backdropFilter: "blur(8px)" }}>
      <Toolbar sx={{ maxWidth: 1060, mx: "auto", width: "100%", py: 1.25, px: { xs: 3, sm: 5, md: 8, lg: 10 }, gap: 3 }}>
        <Stack component={Link} href="/" direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0, textDecoration: "none" }}>
          <Box style={{ display: 'flex', justifyContent: 'center' }}>
            <CardMedia
              sx={{ height: 28, width: 28, borderRadius: '4px' }}
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
              key={link.href}
              component="a"
              href={link.href}
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

        <Button variant="contained" onClick={onSignIn} sx={{ display: { xs: "none", sm: "inline-flex" } }}>
          Get started
        </Button>
      </Toolbar>
    </AppBar>
  );
}

