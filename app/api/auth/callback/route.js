import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabaseServer";
import { sendWelcomeEmail } from "@/lib/email";

/**
 * GET /api/auth/callback?code=...&next=...&role=...&source_page=...&flow=...
 * Supabase redirects here after Google Sign-In completes. We exchange the
 * auth code for a session, then ensure a corresponding row exists in our
 * own `users` table (the unified account — see TRD section 4).
 *
 * `flow=signin` (from /signin only) means: only look this account up, never
 * create it. If no row exists for this auth_user_id, this Google account
 * has never been through Commission before - redirect to /signup instead
 * of silently creating an account from what was framed as a returning-user
 * sign-in. Every other entry point (signup, or any "request an account"
 * CTA elsewhere) defaults to creating the row if it does not exist yet.
 *
 * The FINAL redirect for an existing/newly-created user is always decided
 * here, based on the real access_granted flag on that row —
 * never by trusting the `next` param as-is. Whoever hasn't been granted
 * access yet lands on /welcome regardless of what `next` asked for.
 *
 * EXCEPTION: /team/accept is always honored regardless of access_granted.
 * Accepting a team invite grants membership on one specific business
 * (business_team_members), which is a narrower, different permission than
 * full Commission dashboard access - someone should be able to accept an
 * invite even if their own account is still pending review.
 */
export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/dashboard";
  const role = url.searchParams.get("role");
  const sourcePage = url.searchParams.get("source_page");
  const flow = url.searchParams.get("flow");
  const alwaysHonorNext = next.startsWith("/team/accept");

  if (!code) {
    return NextResponse.redirect(new URL("/signin", url.origin));
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.user) {
    return NextResponse.redirect(new URL("/signin", url.origin));
  }

  const admin = createAdminSupabaseClient();

  if (flow === "signin") {
    const { data: existing, error: lookupError } = await admin
      .from("users")
      .select("access_granted")
      .eq("auth_user_id", data.user.id)
      .maybeSingle();

    if (lookupError) {
      console.error("Auth callback: failed to look up existing user:", lookupError.message);
    }
    if (!existing) {
      // This Google account has never been through Commission before -
      // /signin should not silently create one. Send them to /signup,
      // which will create it properly on the next Google click.
      //
      // role/sourcePage preserved here - this redirect used to drop them
      // entirely, which is the confirmed cause of intended_role coming
      // back null for anyone routed through /signin first (e.g. the
      // navbar's generic "Get started" button) rather than landing on
      // /signup directly.
      const signupUrl = new URL("/signup", url.origin);
      if (role) signupUrl.searchParams.set("role", role);
      if (sourcePage) signupUrl.searchParams.set("source_page", sourcePage);
      return NextResponse.redirect(signupUrl);
    }
    return NextResponse.redirect(new URL(alwaysHonorNext || existing.access_granted ? next : "/welcome", url.origin));
  }

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

  // Checked BEFORE the upsert, specifically so we know whether this is a
  // genuinely new account - the welcome email should send exactly once, not
  // on every later sign-in from the same person.
  const { data: existingBeforeUpsert } = await admin
    .from("users")
    .select("id")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();
  const isNewSignup = !existingBeforeUpsert;

  const { data: userRow, error: upsertError } = await admin
    .from("users")
    .upsert(upsertData, { onConflict: "auth_user_id" })
    .select("access_granted")
    .single();

  if (upsertError) {
    // Previously swallowed silently, which meant a schema mismatch (e.g.
    // migrations not yet run against the live database) could leave the
    // users table empty while the person still landed on /welcome, looking
    // like everything worked. Now at least logged server-side so this is
    // debuggable from Vercel/hosting logs.
    console.error("Auth callback: failed to upsert user row:", upsertError.message);
  } else if (isNewSignup) {
    const firstName = data.user.user_metadata?.given_name || upsertData.full_name?.split(" ")[0] || "there";
    await sendWelcomeEmail({ to: data.user.email, firstName });
  }

  const destination = alwaysHonorNext || userRow?.access_granted ? next : "/welcome";
  return NextResponse.redirect(new URL(destination, url.origin));
}

