import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabaseServer";

/**
 * GET /api/auth/callback?code=...&next=...&role=...&source_page=...
 * Supabase redirects here after Google Sign-In completes. We exchange the
 * auth code for a session, then ensure a corresponding row exists in our
 * own `users` table (the unified account — see TRD section 4).
 *
 * The FINAL redirect is always decided here, based on the real
 * dashboard_access_granted flag on that user's row — never by trusting the
 * `next` param as-is. This is deliberate: it means /signin, /signup, and
 * every "request an account" CTA on the site (see lib/googleAuth.js) can
 * all call the exact same signInWithOAuth + callback flow safely. Whoever
 * hasn't been granted access yet lands on /welcome regardless of what
 * `next` asked for, and there is no way to request your way past that by
 * editing the query string.
 */
export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/dashboard";
  const role = url.searchParams.get("role");
  const sourcePage = url.searchParams.get("source_page");

  if (!code) {
    return NextResponse.redirect(new URL("/signin", url.origin));
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.user) {
    return NextResponse.redirect(new URL("/signin", url.origin));
  }

  const admin = createAdminSupabaseClient();
  const upsertData = {
    auth_user_id: data.user.id,
    email: data.user.email,
    full_name: data.user.user_metadata?.full_name ?? null,
    avatar_url: data.user.user_metadata?.avatar_url ?? null,
  };
  // Only recorded when present, so a later real sign-in (no role/source_page
  // in the URL) never overwrites what was captured at the original signup.
  if (role) upsertData.intended_role = role;
  if (sourcePage) upsertData.signup_source_page = sourcePage;

  const { data: userRow } = await admin
    .from("users")
    .upsert(upsertData, { onConflict: "auth_user_id" })
    .select("dashboard_access_granted")
    .single();

  const destination = userRow?.dashboard_access_granted ? next : "/welcome";
  return NextResponse.redirect(new URL(destination, url.origin));
}

