import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { sendOtp } from "@/lib/sms";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/leads/embed-send-otp
 * body: { leadRef }
 *
 * The identity-verification half of the custom integration's
 * qualification step (see app/embed/qualify/[leadRef]/page.js). This
 * runs regardless of the referring affiliate's trust status, every
 * single time - unlike capture-time Radar, which Trusted affiliates
 * skip. That's deliberate: capture-time trust answers "does this
 * affiliate have a good track record," but this step answers a
 * different question entirely - "is the person confirming right now
 * actually reachable at the phone number on file." A Trusted affiliate
 * can self-deal a fake lead exactly as easily as a new one, so trust
 * status has no bearing on whether this check is needed.
 */
export async function POST(req) {
  const { leadRef } = await req.json();
  if (!leadRef) {
    return NextResponse.json({ error: "leadRef is required" }, { status: 400, headers: CORS_HEADERS });
  }

  const supabase = createAdminSupabaseClient();

  const { data: lead } = await supabase.from("leads").select("id, status, program_id").eq("lead_ref", leadRef).maybeSingle();
  if (!lead) {
    return NextResponse.json({ error: "This link is no longer valid" }, { status: 404, headers: CORS_HEADERS });
  }
  if (lead.status !== "captured") {
    return NextResponse.json({ error: `This lead is already ${lead.status}` }, { status: 400, headers: CORS_HEADERS });
  }

  const { data: pending } = await supabase
    .from("external_lead_pending")
    .select("full_name, phone")
    .eq("lead_id", lead.id)
    .maybeSingle();
  if (!pending) {
    return NextResponse.json({ error: "This confirmation link has expired. Please start again." }, { status: 404, headers: CORS_HEADERS });
  }

  const { data: program } = await supabase.from("affiliate_programs").select("campaigns(name, business_id, businesses(name))").eq("id", lead.program_id).single();
  const businessName = program?.campaigns?.businesses?.name || "the business";

  let sent;
  try {
    sent = await sendOtp(pending.phone, businessName);
  } catch (err) {
    return NextResponse.json({ error: `Could not send verification code: ${err.message}` }, { status: 502, headers: CORS_HEADERS });
  }

  const { error: updateError } = await supabase.from("external_lead_pending").update({ termii_pin_id: sent.pinId }).eq("lead_id", lead.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500, headers: CORS_HEADERS });
  }

  const firstName = pending.full_name.split(" ")[0];
  return NextResponse.json({ firstName, businessName }, { headers: CORS_HEADERS });
}
