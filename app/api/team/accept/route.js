import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabaseServer";
import { sendTeamInviteAcceptedEmail } from "@/lib/email";

/**
 * POST /api/team/accept
 * body: { token }
 *
 * Restored - see app/api/team/invite/route.js for context. Called by
 * app/team/accept/page.js once the invited person is signed in.
 */
export async function POST(req) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: invite } = await admin
    .from("core_business_team_members")
    .select("id, business_id, email, role, invited_by, core_businesses(name)")
    .eq("invite_token", token)
    .eq("status", "invited")
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ error: "This invite is invalid or has already been used" }, { status: 404 });
  }

  // The token itself is the real secret, but this catches the case of
  // someone forwarding their own invite link to a different Google account
  // by mistake - the invite was addressed to a specific email.
  if (invite.email.toLowerCase() !== (authUser.email || "").toLowerCase()) {
    return NextResponse.json(
      { error: `This invite was sent to ${invite.email} - sign in with that email instead.` },
      { status: 403 }
    );
  }

  const { data: userRow } = await supabase.from("core_users").select("id, full_name, email").eq("auth_user_id", authUser.id).single();
  if (!userRow) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { error: updateError } = await admin
    .from("core_business_team_members")
    .update({ user_id: userRow.id, status: "active" })
    .eq("id", invite.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (invite.invited_by) {
    const { data: inviter } = await admin.from("core_users").select("email, full_name").eq("id", invite.invited_by).single();
    if (inviter?.email) {
      try {
        await sendTeamInviteAcceptedEmail({
          to: inviter.email,
          inviterName: inviter.full_name,
          memberEmail: userRow.email || authUser.email,
          businessName: invite.businesses?.name,
          teamUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://commission.ng"}/dashboard/account`,
        });
      } catch (emailError) {
        console.error("Failed to send team invite accepted email", emailError);
      }
    }
  }

  return NextResponse.json({ businessId: invite.business_id });
}
