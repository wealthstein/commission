import { createClient } from "@/lib/supabaseClient";
import { urls } from "@/lib/urls";

/**
 * Every "request an account" / "get started" CTA on the site now triggers
 * this directly - there is no longer a manual name/email/phone form
 * anywhere. `role` and `sourcePage` are passed through as query params on
 * the OAuth redirect so app/api/auth/callback can store them on the user's
 * row.
 *
 * `next` always defaults to /dashboard - the real destination for anyone
 * who HAS been granted access. This is safe to request unconditionally
 * because app/api/auth/callback ignores it and sends to /welcome instead
 * for anyone whose dashboard_access_granted is not yet true - which is
 * everyone, pre-launch. Never hardcode next to /welcome here; that would
 * incorrectly block a real, already-granted sign-in too.
 */
export async function triggerGoogleAuth({ role, sourcePage } = {}) {
  const supabase = createClient();
  const params = new URLSearchParams({ next: urls.dashboard() });
  if (role) params.set("role", role);
  if (sourcePage) params.set("source_page", sourcePage);

  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/api/auth/callback?${params.toString()}` },
  });
}
