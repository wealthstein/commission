import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabaseServer";

/**
 * PATCH/DELETE /api/team/[memberId]
 *
 * Restored - see app/api/team/invite/route.js for context. PATCH changes a
 * teammate's role; DELETE revokes access (soft - sets status='revoked'
 * rather than deleting the row, both to preserve the audit trail and so
 * business_team_members' unique(business_id, email) constraint stays
 * meaningful if they're ever re-invited - see the invite route's upsert).
 */
async function requireOwnerOrAdmin(supabase, businessId) {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };

  const { data: userRow } = await supabase.from("core_users").select("id").eq("auth_user_id", authUser.id).single();
  if (!userRow) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };

  const { data: business } = await supabase.from("core_businesses").select("owner_id").eq("id", businessId).single();
  const isOwner = business?.owner_id === userRow.id;

  let isActiveAdmin = false;
  if (!isOwner) {
    const { data: membership } = await supabase
      .from("core_business_team_members")
      .select("role, status")
      .eq("business_id", businessId)
      .eq("user_id", userRow.id)
      .maybeSingle();
    isActiveAdmin = membership?.status === "active" && membership.role === "admin";
  }

  if (!isOwner && !isActiveAdmin) {
    return { error: NextResponse.json({ error: "Only the business owner or an admin teammate can manage the team" }, { status: 403 }) };
  }
  return { userRow };
}

export async function PATCH(req, { params }) {
  const { role } = await req.json();
  if (!["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "role must be 'admin' or 'member'" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const admin = createAdminSupabaseClient();

  const { data: member } = await admin.from("core_business_team_members").select("business_id").eq("id", params.memberId).single();
  if (!member) return NextResponse.json({ error: "Team member not found" }, { status: 404 });

  const auth = await requireOwnerOrAdmin(supabase, member.business_id);
  if (auth.error) return auth.error;

  const { error } = await admin.from("core_business_team_members").update({ role }).eq("id", params.memberId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const supabase = createServerSupabaseClient();
  const admin = createAdminSupabaseClient();

  const { data: member } = await admin.from("core_business_team_members").select("business_id").eq("id", params.memberId).single();
  if (!member) return NextResponse.json({ error: "Team member not found" }, { status: 404 });

  const auth = await requireOwnerOrAdmin(supabase, member.business_id);
  if (auth.error) return auth.error;

  const { error } = await admin.from("core_business_team_members").update({ status: "revoked", user_id: null }).eq("id", params.memberId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
