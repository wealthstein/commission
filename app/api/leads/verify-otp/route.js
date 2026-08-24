import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { verifyOtp } from "@/lib/sms";
import { createLeadAndGetIntentFormUrl } from "@/lib/leadCreation";
import { hashIdentifier, computeTimingFlags, computeCrossCampaignFlags } from "@/lib/riskSignals";

/**
 * POST /api/leads/verify-otp
 * body: { otpId, pin }
 *
 * The other half of the Radar OTP flow started in app/api/leads/capture -
 * that route holds an unproven affiliate's lead data in otp_verifications
 * rather than creating the lead immediately. This route confirms the code
 * with Termii and, only on success, creates the real lead using the exact
 * same shared logic the trusted-affiliate path uses (lib/leadCreation.js),
 * so the two paths can never quietly produce different results.
 *
 * The staging row is deleted outright on both success and permanent
 * failure - not just marked used. It was only ever meant to exist for the
 * few minutes between OTP send and verify.
 */
export async function POST(req) {
  const { otpId, pin } = await req.json();
  if (!otpId || !pin) {
    return NextResponse.json({ error: "otpId and pin are required" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: otpRow } = await supabase.from("otp_verifications").select("*").eq("id", otpId).maybeSingle();
  if (!otpRow) {
    return NextResponse.json({ error: "This verification session has expired. Please start again." }, { status: 404 });
  }

  if (new Date(otpRow.expires_at) < new Date()) {
    await supabase.from("otp_verifications").delete().eq("id", otpId);
    return NextResponse.json({ error: "This code has expired. Please start again." }, { status: 400 });
  }

  if (otpRow.attempts >= 3) {
    await supabase.from("otp_verifications").delete().eq("id", otpId);
    return NextResponse.json({ error: "Too many incorrect attempts. Please start again." }, { status: 400 });
  }

  let verified;
  try {
    verified = await verifyOtp(otpRow.termii_pin_id, pin);
  } catch (err) {
    return NextResponse.json({ error: `Could not verify code: ${err.message}` }, { status: 502 });
  }

  if (!verified) {
    await supabase.from("otp_verifications").update({ attempts: otpRow.attempts + 1 }).eq("id", otpId);
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  }

  const { data: program } = await supabase
    .from("affiliate_programs")
    .select("*, campaigns(name, business_id)")
    .eq("id", otpRow.program_id)
    .eq("status", "active")
    .maybeSingle();
  if (!program) {
    await supabase.from("otp_verifications").delete().eq("id", otpId);
    return NextResponse.json({ error: "This campaign is no longer available" }, { status: 404 });
  }

  try {
    const result = await createLeadAndGetIntentFormUrl(supabase, {
      programId: otpRow.program_id,
      enrollmentId: otpRow.enrollment_id,
      clickId: otpRow.click_id,
      program,
    });

    try {
      const phoneHash = hashIdentifier(otpRow.phone);
      const ipHash = hashIdentifier(otpRow.submitter_ip);
      const timingFlags = computeTimingFlags({
        pageLoadedAt: otpRow.page_loaded_at,
        firstInteractionAt: otpRow.first_interaction_at,
      });
      const crossCampaignFlags = await computeCrossCampaignFlags(supabase, {
        phoneHash,
        ipHash,
        excludeProgramId: otpRow.program_id,
      });
      const riskFlags = [...timingFlags, ...crossCampaignFlags];

      await supabase.from("leads").update({ risk_flags: riskFlags }).eq("id", result.leadId);
      await supabase.from("lead_risk_signals").insert({
        lead_id: result.leadId,
        phone_hash: phoneHash,
        ip_hash: ipHash,
        page_loaded_at: otpRow.page_loaded_at,
        first_interaction_at: otpRow.first_interaction_at,
      });
    } catch (riskErr) {
      console.error("Risk signal computation failed (lead still created successfully):", riskErr.message);
    }

    // Delete immediately on success - this row's only job was to bridge
    // the gap between OTP send and verify, and it held real PII that has
    // no reason to exist a moment longer than necessary.
    await supabase.from("otp_verifications").delete().eq("id", otpId);

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
