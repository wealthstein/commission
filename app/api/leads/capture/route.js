import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { getAffiliateTrustStatus } from "@/lib/trustScore";
import { sendOtp } from "@/lib/sms";
import { createLeadAndGetIntentFormUrl } from "@/lib/leadCreation";

/**
 * POST /api/leads/capture
 * body: { programId, fullName, phone, email? }
 * cookies: cmn_ref (referral code), cmn_visitor (anonymous visitor id) — both
 *          set by app/r/[code]/route.js when the visitor first clicked a link
 *
 * This is the "Interest Form" step: Visitor -> Campaign Page -> Interest Form ->
 * Lead. Nothing is charged here — a captured lead only becomes billable once
 * the prospect completes the Intent Form themselves (see
 * app/api/leads/continue/route.js). There is no manual qualification path
 * anymore - a lead is only ever qualified by that objective, system-recorded
 * action, never by a business's own say-so.
 *
 * A referral link click is required to submit this form — Commission's
 * whole model here is affiliate-driven leads, so there is no one to pay (or
 * bill the wallet on behalf of) for a lead with no attributable referrer.
 *
 * Radar trust check: a lead from a Trusted affiliate (see lib/trustScore.js)
 * is created immediately, same as always. A lead from an unproven affiliate
 * triggers an inline OTP step instead - the lead itself is not created here
 * at all in that case; it only gets created once the code is verified (see
 * app/api/leads/verify-otp/route.js), using the exact same creation logic.
 */
export async function POST(req) {
  const { programId, fullName, phone, email } = await req.json();
  if (!programId || !fullName || !phone || !email) {
    return NextResponse.json({ error: "programId, fullName, phone, and email are required" }, { status: 400 });
  }

  const referralCode = req.cookies.get("cmn_ref")?.value;
  if (!referralCode) {
    return NextResponse.json(
      { error: "This form requires a referral link — please use the affiliate's shared link to get here." },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();

  const { data: enrollment } = await supabase
    .from("affiliate_enrollments")
    .select("id, affiliate_id")
    .eq("referral_code", referralCode)
    .eq("status", "active")
    .maybeSingle();
  if (!enrollment) {
    return NextResponse.json({ error: "Referral link is no longer active" }, { status: 400 });
  }

  // A submitted customer phone can't match the referring affiliate's own
  // verified phone - this doesn't catch every way someone could fake a
  // lead (a second SIM, a cooperating friend's number still passes), but
  // it stops the laziest version of an affiliate self-dealing their own
  // referrals, and Nigeria's 5-SIM-per-NIN cap keeps the harder version
  // genuinely inconvenient to scale.
  const { data: affiliateUser } = await supabase.from("users").select("phone").eq("id", enrollment.affiliate_id).maybeSingle();
  if (affiliateUser?.phone && affiliateUser.phone === phone) {
    return NextResponse.json({ error: "This phone number can't be used for a lead you're referring yourself." }, { status: 400 });
  }

  const { data: program } = await supabase
    .from("affiliate_programs")
    .select("*, products(name, business_id, businesses(name))")
    .eq("id", programId)
    .eq("status", "active")
    .maybeSingle();
  if (!program || program.conversion_goal !== "lead") {
    return NextResponse.json({ error: "This campaign is not accepting leads" }, { status: 404 });
  }

  // Best-effort: attach the most recent unexpired click for this visitor/enrollment.
  const visitorId = req.cookies.get("cmn_visitor")?.value;
  let clickId = null;
  if (visitorId) {
    const { data: click } = await supabase
      .from("referral_clicks")
      .select("id")
      .eq("enrollment_id", enrollment.id)
      .eq("visitor_id", visitorId)
      .gt("expires_at", new Date().toISOString())
      .order("landed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    clickId = click?.id ?? null;
  }

  // TEMPORARILY DISABLED via env var, same pattern as
  // DISABLE_PHONE_VERIFICATION_GATE - Termii's account needs country/DND
  // activation before any OTP can actually send. This treats every lead as
  // if it came from a Trusted affiliate, skipping OTP entirely, so the
  // rest of the flow (Intent Form, custom fields, qualification, business
  // notification) can still be tested. Nothing about Radar's actual
  // trust-scoring logic changed - remove DISABLE_RADAR_OTP from the
  // environment (or set it to anything other than "true") once Termii
  // confirms activation.
  const radarOtpDisabled = process.env.DISABLE_RADAR_OTP === "true";
  const trust = radarOtpDisabled ? { trusted: true } : await getAffiliateTrustStatus(supabase, enrollment.affiliate_id);

  if (!trust.trusted) {
    let sent;
    try {
      sent = await sendOtp(phone, program.products?.businesses?.name);
    } catch (err) {
      return NextResponse.json({ error: `Could not send verification code: ${err.message}` }, { status: 502 });
    }

    const { data: otpRow, error: otpError } = await supabase
      .from("otp_verifications")
      .insert({
        program_id: programId,
        enrollment_id: enrollment.id,
        click_id: clickId,
        termii_pin_id: sent.pinId,
        phone,
        full_name: fullName,
        email,
      })
      .select("id")
      .single();
    if (otpError) {
      return NextResponse.json({ error: otpError.message }, { status: 500 });
    }

    return NextResponse.json({ needsOtp: true, otpId: otpRow.id });
  }

  try {
    const result = await createLeadAndGetIntentFormUrl(supabase, { programId, enrollmentId: enrollment.id, clickId, program });
    return NextResponse.json({ needsOtp: false, ...result });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}