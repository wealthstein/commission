import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabaseServer";
import { sendTeamInviteEmail } from "@/lib/email";
import { inboxLimitsForPlan } from "@/lib/inboxPlanLimits";

/**
 * POST /api/team/invite
 * body: { businessId, email, role }
 *
 * Restored - this route was previously stubbed to always return 403 when
 * Team Management was disabled sitewide during a pricing-model change.
 * Team seats are shared across the whole business (not Inbox-specific),
 * so the per-plan seat cap lives in lib/inboxPlanLimits.js (maxSeats) and
 * is enforced here - the same numbers shown as "Inbox: up to N team
 * seats" in content/pricingPlans.json, since a seat is a seat regardless
 * of which part of the app someone's using.
 */
export async function POST(req) {
  const { businessId, email, role } = await req.json();
  if (!businessId || !email) {
    return NextResponse.json({ error: "businessId and email are required" }, { status: 400 });
  }
  const normalizedRole = role === "admin" ? "admin" : "member";
  const normalizedEmail = email.toLowerCase().trim();

  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: userRow } = await supabase.from("core_users").select("id, full_name, email").eq("auth_user_id", authUser.id).single();
  if (!userRow) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: business } = await supabase.from("core_businesses").select("id, name, owner_id, plan").eq("id", businessId).single();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const isOwner = business.owner_id === userRow.id;
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
    return NextResponse.json({ error: "Only the business owner or an admin teammate can invite people" }, { status: 403 });
  }

  if (normalizedEmail === (userRow.email || "").toLowerCase()) {
    return NextResponse.json({ error: "You can't invite yourself" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // Re-inviting a previously revoked email is allowed (upsert onto the same
  // unique(business_id, email) row, fresh token, status back to 'invited').
  // Re-inviting someone already 'active' or already 'invited' is rejected
  // with a clear reason rather than silently resetting their token.
  const { data: existing } = await admin
    .from("core_business_team_members")
    .select("id, status")
    .eq("business_id", businessId)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existing?.status === "active") {
    return NextResponse.json({ error: "This person is already on the team" }, { status: 409 });
  }
  if (existing?.status === "invited") {
    return NextResponse.json({ error: "An invite is already pending for this email" }, { status: 409 });
  }

  const { maxSeats } = inboxLimitsForPlan(business.plan);
  if (maxSeats !== null) {
    const { count: activeCount } = await admin
      .from("core_business_team_members")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .in("status", ["active", "invited"]);

    // maxSeats counts the whole team including the owner (who has no
    // business_team_members row themselves, hence the +1).
    const seatsUsed = (activeCount ?? 0) + 1;
    if (seatsUsed >= maxSeats) {
      return NextResponse.json(
        {
          error: maxSeats === 0
            ? "Team collaboration isn't included on your plan. Upgrade to add teammates."
            : `Your plan includes up to ${maxSeats} team seats (including you). Upgrade to add more.`,
        },
        { status: 402 }
      );
    }
  }

  const { data: member, error } = await admin
    .from("core_business_team_members")
    .upsert(
      {
        business_id: businessId,
        email: normalizedEmail,
        role: normalizedRole,
        status: "invited",
        invited_by: userRow.id,
        invite_token: crypto.randomUUID(),
        user_id: null,
      },
      { onConflict: "business_id,email" }
    )
    .select()
    .single();

  if (error || !member) {
    return NextResponse.json({ error: error?.message ?? "Failed to create invite" }, { status: 500 });
  }

  const acceptUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://commission.ng"}/team/accept?token=${member.invite_token}`;

  try {
    await sendTeamInviteEmail({
      to: normalizedEmail,
      businessName: business.name,
      invitedByName: userRow.full_name || authUser.user_metadata?.full_name,
      role: normalizedRole,
      acceptUrl,
    });
  } catch (emailError) {
    // Don't fail the request over an email hiccup - the row exists and the
    // owner can see it's pending; worst case they share the link manually.
    console.error("Failed to send team invite email", emailError);
  }

  return NextResponse.json({ memberId: member.id });
}
