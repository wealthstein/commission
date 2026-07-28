"use client";

import { AppBar, Toolbar, Box, Typography, Button, ToggleButtonGroup, ToggleButton, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";

const NAV_LINKS = [
  { href: "#benefits", label: "Benefits" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar({ audience, onAudienceChange, onSignIn }) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: "rgba(250,249,245,0.85)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${tokens.border}` }}
    >
      <Toolbar sx={{ maxWidth: 1160, mx: "auto", width: "100%", py: 1.25, gap: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              bgcolor: tokens.brand,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Typography sx={{ color: tokens.brandInk, fontWeight: 800, fontSize: 15, lineHeight: 1 }}>C</Typography>
          </Box>
          <Typography variant="h6" sx={{ color: tokens.ink, fontWeight: 700, fontSize: 18 }}>
            Commission
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={3}
          sx={{ display: { xs: "none", md: "flex" }, flexGrow: 1 }}
        >
          {NAV_LINKS.map((link) => (
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
          Sign in
        </Button>
      </Toolbar>
    </AppBar>
  );
}
