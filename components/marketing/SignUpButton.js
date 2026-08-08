import Link from "next/link";
import { Box, Button } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { urls } from "@/lib/urls";
import { tokens } from "@/lib/theme";

/**
 * Replaces the old embedded RequestAccountForm (removed entirely) on every
 * page that used to have it - a button linking to /signup, with the page
 * it was clicked from preserved as ?source=... so AuthPage.js can still
 * attribute the eventual signup correctly. Pass `role` too on any page
 * that already knows the answer (most of them do - /industries pages are
 * always business-facing, /programs pages are always affiliate-facing,
 * etc.) so intended_role gets captured without needing any UI on the
 * signup page itself.
 *
 * Centered, generously spaced, and sized up by default - this used to
 * render as a small, left-aligned button with no breathing room, easy to
 * miss immediately after a heavy section (a dark "In Practice" box, a
 * comparison table). Pass `inline` to opt back into the old plain,
 * unwrapped behavior for the rare spot that genuinely needs it.
 */
export default function SignUpButton({ sourcePage, role, label = "Get started", fullWidth, size = "large", variant = "contained", inline = false }) {
  const params = new URLSearchParams();
  if (sourcePage) params.set("source", sourcePage);
  if (role) params.set("role", role);
  const query = params.toString();
  const href = query ? `${urls.signup()}?${query}` : urls.signup();

  const button = (
    <Button
      component={Link}
      href={href}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      endIcon={<ArrowForwardRoundedIcon sx={{ color: tokens.brandInk }} />}
      sx={{
        px: 5,
        py: 1.75,
        fontSize: 16,
        boxShadow: variant === "contained" ? `0 8px 24px -8px ${tokens.brand}` : "none",
        "&:hover": { boxShadow: variant === "contained" ? `0 10px 28px -6px ${tokens.brand}` : "none" },
      }}
    >
      {label}
    </Button>
  );

  if (inline) return button;

  return (
    <Box sx={{ textAlign: "center", my: { xs: 5, md: 7 } }}>
      {button}
    </Box>
  );
}
