import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { createLeadAndGetIntentFormUrl } from "@/lib/leadCreation";
import { hashIdentifier, computeTimingFlags, computeCrossCampaignFlags } from "@/lib/riskSignals";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * OPTIONS /api/leads/external-capture - CORS preflight. Allowed from any
 * origin deliberately - a business's own site is the caller here, and we
 * cannot know every domain in advance the way an allowlist would require.
 * Authenticity is instead verified by the referralCode/programId pairing
 * below, not by origin.
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/leads/external-capture
 * body: { programId, referralCode, fullName, phone, email, metadata? }
 * metadata: a flexible object for whatever else the business's own form
 *   collects (budget range, timeline, etc.) - same pattern as Stripe's
 *   metadata field. Not validated against campaign_custom_fields the way
 *   the hosted Intent Form is, since this business built their own form
 *   independently - it's stored as-is and forwarded to the business
 *   alongside the rest of the lead at qualification time.
 *
 * Called by public/commission-track.js from a business's own site, not
 * from Commission's hosted Interest Form. Only available on Medium and
 * Large plans - this is the "Custom integrations" feature listed on
 * those plans.
 *
 * Radar's inline OTP at THIS step is intentionally skipped - trusted
 * affiliates already skip it on the hosted flow too, and this endpoint
 * defers the actual person-verification to the embedded qualification
 * widget instead (see app/embed/qualify/[leadRef]/page.js), which runs
 * regardless of affiliate trust status, every time - see that route's
 * own comment for why capture-time trust and qualification-time identity
 * verification are different questions.
 */
export async function POST(req) {
  const { programId, referralCode, fullName, phone, email, metadata, pageLoadedAt } = await req.json();
  if (!programId || !referralCode || !fullName || !phone || !email) {
    return NextResponse.json(
      { error: "programId, referralCode, fullName, phone, and email are required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const submitterIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

  const supabase = createAdminSupabaseClient();

  const { data: enrollment } = await supabase
    .from("affiliate_enrollments")
    .select("id, affiliate_id")
    .eq("referral_code", referralCode)
    .eq("status", "active")
    .maybeSingle();
  if (!enrollment) {
    return NextResponse.json({ error: "Referral link is no longer active" }, { status: 400, headers: CORS_HEADERS });
  }

  // Same check as the hosted Interest Form - a submitted customer phone
  // can't match the referring affiliate's own verified phone.
  const { data: affiliateUser } = await supabase.from("core_users").select("phone").eq("id", enrollment.affiliate_id).maybeSingle();
  if (affiliateUser?.phone && affiliateUser.phone === phone) {
    return NextResponse.json(
      { error: "This phone number can't be used for a lead you're referring yourself." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { data: program } = await supabase
    .from("affiliate_programs")
    .select("*, affiliate_campaigns(name, business_id, core_businesses(plan))")
    .eq("id", programId)
    .eq("status", "active")
    .maybeSingle();
  if (!program || program.conversion_goal !== "lead") {
    return NextResponse.json({ error: "This campaign is not accepting leads" }, { status: 404, headers: CORS_HEADERS });
  }

  // referralCode must genuinely belong to an enrollment in THIS program -
  // otherwise a valid code from one program could be used to attribute a
  // lead to a completely different one.
  const { data: enrollmentInProgram } = await supabase
    .from("affiliate_enrollments")
    .select("id")
    .eq("id", enrollment.id)
    .eq("program_id", programId)
    .maybeSingle();
  if (!enrollmentInProgram) {
    return NextResponse.json({ error: "This referral code does not belong to this program" }, { status: 400, headers: CORS_HEADERS });
  }

  const plan = program.campaigns?.businesses?.plan;
  if (plan !== "pro" && plan !== "plus") {
    return NextResponse.json(
      { error: "Custom integrations are available on Medium and Large plans" },
      { status: 403, headers: CORS_HEADERS }
    );
  }

  try {
    const result = await createLeadAndGetIntentFormUrl(supabase, {
      programId,
      enrollmentId: enrollment.id,
      clickId: null,
      program,
    });

    const { error: pendingError } = await supabase
      .from("external_lead_pending")
      .insert({ lead_id: result.leadId, full_name: fullName, phone, email, metadata: metadata || null });
    if (pendingError) throw pendingError;

    try {
      const phoneHash = hashIdentifier(phone);
      const ipHash = hashIdentifier(submitterIp);
      // firstInteractionAt is deliberately not requested here - Commission's
      // tracking script doesn't own the business's own form fields the way
      // LeadShortForm.js does, so it can't reliably know when the customer
      // first touched the form. Only the page-load-based signal applies.
      const timingFlags = computeTimingFlags({ pageLoadedAt });
      const crossCampaignFlags = await computeCrossCampaignFlags(supabase, { phoneHash, ipHash, excludeProgramId: programId });
      const riskFlags = [...timingFlags, ...crossCampaignFlags];

      await supabase.from("affiliate_leads").update({ risk_flags: riskFlags }).eq("id", result.leadId);
      await supabase.from("lead_risk_signals").insert({
        lead_id: result.leadId,
        phone_hash: phoneHash,
        ip_hash: ipHash,
        page_loaded_at: pageLoadedAt || null,
      });
    } catch (riskErr) {
      console.error("Risk signal computation failed (lead still created successfully):", riskErr.message);
    }

    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
