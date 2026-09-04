import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabaseServer";
import { buildLineage, assertWithinMaxTiers } from "@/lib/commissionEngine";

/**
 * POST /api/enrollments/join
 * body: { programId, referrerReferralCode? }
 *
 * This is the ONE place in the app that creates an affiliate_enrollments
 * row - both the Discover page's "Join" button and the public join page
 * (app/products/[businessSlug]/[productSlug]/join) call this now, instead
 * of inserting directly from the client the way they used to.
 *
 * Why this moved server-side: setting referrer_enrollment_id correctly
 * requires real validation - looking up the referring enrollment, confirming
 * it belongs to the same program, and checking it wouldn't push the new
 * enrollment past the platform's 3-tier depth limit. That logic already
 * exists and is already proven correct at payout time
 * (lib/commissionEngine.js's buildLineage/assertWithinMaxTiers, used by
 * both the Paystack webhook and the sale-verification route) - this reuses
 * the exact same functions rather than reimplementing tier-depth logic a
 * second time.
 *
 * referrerReferralCode is optional and silently ignored if invalid,
 * doesn't belong to this program, or would exceed the tier limit - in
 * every one of those cases this just falls back to a normal tier-1 join
 * rather than hard-failing, since an invalid/expired recruitment link
 * shouldn't block someone from joining the program at all, just from
 * being attributed to a specific recruiter.
 */
export async function POST(req) {
  const { programId, referrerReferralCode } = await req.json();
  if (!programId) {
    return NextResponse.json({ error: "programId is required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();

  const { data: userRow } = await admin.from("core_users").select("id").eq("auth_user_id", authUser.id).single();
  if (!userRow) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const { data: existing } = await admin
    .from("affiliate_enrollments")
    .select("id")
    .eq("affiliate_id", userRow.id)
    .eq("program_id", programId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "You're already enrolled in this program" }, { status: 409 });
  }

  let referrerEnrollmentId = null;

  if (referrerReferralCode) {
    const { data: referrer } = await admin
      .from("affiliate_enrollments")
      .select("id, referrer_enrollment_id")
      .eq("referral_code", referrerReferralCode)
      .eq("program_id", programId)
      .eq("status", "active")
      .maybeSingle();

    if (referrer) {
      // Pre-fetch the referrer's own ancestor chain into a map first, then
      // hand buildLineage a synchronous lookup - same pattern the Paystack
      // webhook already uses successfully, rather than reimplementing a
      // second, slightly different tier-walk here that could drift from
      // the tested one over time.
      const lineageMap = new Map([[referrer.id, referrer]]);
      let cursor = referrer;
      while (lineageMap.size < 3 && cursor.referrer_enrollment_id && !lineageMap.has(cursor.referrer_enrollment_id)) {
        const { data: parent } = await admin
          .from("affiliate_enrollments")
          .select("id, referrer_enrollment_id")
          .eq("id", cursor.referrer_enrollment_id)
          .maybeSingle();
        if (!parent) break;
        lineageMap.set(parent.id, parent);
        cursor = parent;
      }

      const lineage = buildLineage(referrer, (id) => lineageMap.get(id) ?? null);

      try {
        assertWithinMaxTiers(lineage.length);
        referrerEnrollmentId = referrer.id;
      } catch {
        // Referrer is already at the max tier depth - silently fall back
        // to a normal tier-1 join rather than blocking the signup itself.
        referrerEnrollmentId = null;
      }
    }
  }

  const { data: enrollment, error } = await admin
    .from("affiliate_enrollments")
    .insert({ affiliate_id: userRow.id, program_id: programId, referrer_enrollment_id: referrerEnrollmentId })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ enrollmentId: enrollment.id, joinedAsSubAffiliate: !!referrerEnrollmentId });
}
