import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabaseServer";
import { sendTeamInviteEmail } from "@/lib/email";

/**
 * POST /api/team/invite
 * body: { businessId, email, role }
 *
 * Team Management is a Medium/Large plan feature (see
 * lib/siteSections.js "team-management"). Inserting through the regular
 * session-scoped client means RLS (team_members_manage in schema.sql)
 * enforces that only the business owner or an active admin can do this -
 * no manual ownership check needed here.
 */
export async function POST(req) {
  const { businessId, email, role } = await req.json();
  if (!businessId || !email) {
    return NextResponse.json({ error: "businessId and email are required" }, { status: 400 });
  }
  if (role && !["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "role must be 'admin' or 'member'" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Plan gate - Small plans are single-user. Checked with the admin client
  // since the caller may not yet have a team_members row to read through RLS.
  const admin = createAdminSupabaseClient();
  const { data: business } = await admin.from("businesses").select("id, name, plan").eq("id", businessId).single();
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  if (business.plan === "free") {
    return NextResponse.json({ error: "Team management is available on Medium and Large plans." }, { status: 403 });
  }

  const { data: inviterRow } = await admin.from("users").select("id, full_name, email").eq("auth_user_id", authUser.id).single();

  const { data: member, error } = await supabase
    .from("business_team_members")
    .insert({
      business_id: businessId,
      email,
      role: role || "member",
      invited_by: inviterRow.id,
    })
    .select()
    .single();

  if (error) {
    // unique(business_id, email) - this person is already invited/on the team.
    if (error.code === "23505") {
      return NextResponse.json({ error: "This email has already been invited to this business." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const acceptUrl = `${req.nextUrl.origin}/team/accept?token=${member.invite_token}`;
  await sendTeamInviteEmail({
    to: email,
    businessName: business.name,
    invitedByName: inviterRow.full_name || inviterRow.email,
    role: member.role,
    acceptUrl,
  });

  return NextResponse.json({ member });
}
