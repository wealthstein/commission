import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { verifyOtp } from "@/lib/sms";
import { qualifyLead } from "@/lib/leadQualification";
import { forwardLeadToBusiness } from "@/lib/leadForwarding";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/leads/embed-verify-otp
 * body: { leadRef, pin }
 *
 * This is the one request in the whole custom-integration flow that
 * matters most for trust: it is submitted from inside Commission's own
 * iframe, not from the business's JavaScript, which is what stops a
 * business (or a self-dealing affiliate) from intercepting, delaying, or
 * suppressing it. Everything downstream - charging the wallet, paying
 * affiliates, forwarding the lead - is identical to the hosted Intent
 * Form's qualification (lib/leadQualification.js, lib/leadForwarding.js).
 */
export async function POST(req) {
  const { leadRef, pin } = await req.json();
  if (!leadRef || !pin) {
    return NextResponse.json({ error: "leadRef and pin are required" }, { status: 400, headers: CORS_HEADERS });
  }

  const admin = createAdminSupabaseClient();

  const { data: lead } = await admin.from("affiliate_leads").select("*").eq("lead_ref", leadRef).maybeSingle();
  if (!lead) {
    return NextResponse.json({ error: "This link is no longer valid" }, { status: 404, headers: CORS_HEADERS });
  }
  if (lead.status !== "captured") {
    return NextResponse.json({ error: `This lead is already ${lead.status}` }, { status: 400, headers: CORS_HEADERS });
  }

  const { data: pending } = await admin.from("external_lead_pending").select("*").eq("lead_id", lead.id).maybeSingle();
  if (!pending?.termii_pin_id) {
    return NextResponse.json({ error: "No pending verification - request a new code first" }, { status: 400, headers: CORS_HEADERS });
  }
  if (new Date(pending.expires_at) < new Date()) {
    await admin.from("external_lead_pending").delete().eq("lead_id", lead.id);
    return NextResponse.json({ error: "This confirmation link has expired. Please start again." }, { status: 400, headers: CORS_HEADERS });
  }

  let verified;
  try {
    verified = await verifyOtp(pending.termii_pin_id, pin);
  } catch (err) {
    return NextResponse.json({ error: `Could not verify code: ${err.message}` }, { status: 502, headers: CORS_HEADERS });
  }
  if (!verified) {
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400, headers: CORS_HEADERS });
  }

  const { data: program } = await admin
    .from("affiliate_programs")
    .select("*, affiliate_campaigns(name, business_id, core_businesses(*))")
    .eq("id", lead.program_id)
    .single();
  const business = program.campaigns.businesses;

  let chargeAmount;
  try {
    const result = await qualifyLead(admin, { lead, program, business });
    chargeAmount = result.chargeAmount;
  } catch (err) {
    return NextResponse.json(
      { error: "This campaign cannot accept new leads right now - please try again shortly." },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  const { data: businessOwner } = await admin.from("core_businesses").select("owner_id").eq("id", business.id).single();
  const { data: ownerRow } = await admin.from("core_users").select("email").eq("id", businessOwner?.owner_id).maybeSingle();

  const { data: enrollment } = await admin.from("affiliate_enrollments").select("affiliate_id").eq("id", lead.enrollment_id).single();
  const { data: affiliateUser } = await admin.from("core_users").select("email, full_name").eq("id", enrollment?.affiliate_id).maybeSingle();

  const customFieldAnswers = pending.metadata
    ? Object.entries(pending.metadata).map(([label, value]) => ({ label, value: String(value) }))
    : undefined;

  const forwardedTo = await forwardLeadToBusiness(admin, {
    business,
    ownerEmail: ownerRow?.email,
    productName: program.campaigns.name,
    fullName: pending.full_name,
    phone: pending.phone,
    email: pending.email,
    customFieldAnswers,
    affiliateEmail: affiliateUser?.email,
    affiliateName: affiliateUser?.full_name,
  });

  await admin
    .from("affiliate_leads")
    .update({ status: "qualified", qualified_at: new Date().toISOString(), charge_amount_naira: chargeAmount, forwarded_to: forwardedTo })
    .eq("id", lead.id);

  // Delete immediately - same as otp_verifications, this staging row held
  // real PII that has no reason to exist a moment longer than necessary.
  await admin.from("external_lead_pending").delete().eq("lead_id", lead.id);

  return NextResponse.json({ status: "qualified" }, { headers: CORS_HEADERS });
}
