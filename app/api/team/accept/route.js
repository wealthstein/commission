import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabaseServer";

/**
 * POST /api/team/accept
 * body: { token }
 *
 * Deliberately uses the admin client, not the session client - the
 * person accepting does not have an active team_members row yet (that is
 * exactly what this endpoint creates), so RLS would block them from ever
 * reading or updating their own invite. Safety instead comes from
 * requiring the signed-in Google account's email to match the email the
 * invite was actually sent to.
 */
export async function POST(req) {
  const { token } = await req.json();
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const { data: invite } = await admin
    .from("business_team_members")
    .select("id, email, status, business_id")
    .eq("invite_token", token)
    .single();

  if (!invite || invite.status !== "invited") {
    return NextResponse.json({ error: "This invite is no longer valid." }, { status: 404 });
  }
  if (invite.email.toLowerCase() !== authUser.email.toLowerCase()) {
    return NextResponse.json(
      { error: `This invite was sent to ${invite.email} - sign in with that Google account to accept it.` },
      { status: 403 }
    );
  }

  const { data: userRow } = await admin.from("users").select("id").eq("auth_user_id", authUser.id).single();

  const { data: member, error } = await admin
    .from("business_team_members")
    .update({ user_id: userRow.id, status: "active", updated_at: new Date().toISOString() })
    .eq("id", invite.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ member });
}
