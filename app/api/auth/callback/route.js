import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabaseServer";

/**
 * GET /api/auth/callback?code=...
 * Supabase redirects here after Google Sign-In completes. We exchange the
 * auth code for a session, then ensure a corresponding row exists in our
 * own `users` table (the unified account — see TRD section 4).
 */
export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const admin = createAdminSupabaseClient();
      await admin.from("users").upsert(
        {
          auth_user_id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name ?? null,
          avatar_url: data.user.user_metadata?.avatar_url ?? null,
        },
        { onConflict: "auth_user_id" }
      );
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
