import Link from "next/link";
import { Button } from "@mui/material";
import { urls } from "@/lib/urls";

/**
 * Replaces the old embedded RequestAccountForm (removed entirely) on every
 * page that used to have it - a plain button linking to /signup, with the
 * page it was clicked from preserved as ?source=... so AuthPage.js can
 * still attribute the eventual signup correctly. Pass `role` too on any
 * page that already knows the answer (most of them do - /industries pages
 * are always business-facing, /programs pages are always affiliate-facing,
 * etc.) so intended_role gets captured without needing any UI on the
 * signup page itself.
 */
export default function SignUpButton({ sourcePage, role, label = "Get started", fullWidth, size = "large", variant = "contained" }) {
  const params = new URLSearchParams();
  if (sourcePage) params.set("source", sourcePage);
  if (role) params.set("role", role);
  const query = params.toString();
  const href = query ? `${urls.signup()}?${query}` : urls.signup();
  return (
    <Button component={Link} href={href} variant={variant} size={size} fullWidth={fullWidth}>
      {label}
    </Button>
  );
}
