import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { buildLeadWhatsAppLink, generateWhatsAppRef } from "@/lib/whatsapp";

/**
 * POST /api/leads/capture
 * body: { programId, fullName, phone, email? }
 * cookies: cmn_ref (referral code), cmn_visitor (anonymous visitor id) — both
 *          set by app/r/[code]/route.js when the visitor first clicked a link
 *
 * This is the "Interest Form" step: Visitor -> Campaign Page -> Interest Form ->
 * Lead. Nothing is charged here — a captured lead only becomes billable once
 * it is qualified (see app/api/leads/[leadId]/qualify).
 *
 * A referral link click is required to submit this form — Commission's
 * whole model here is affiliate-driven leads, so there is no one to pay (or
 * bill the wallet on behalf of) for a lead with no attributable referrer.
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
    .select("id")
    .eq("referral_code", referralCode)
    .eq("status", "active")
    .maybeSingle();
  if (!enrollment) {
    return NextResponse.json({ error: "Referral link is no longer active" }, { status: 400 });
  }

  const { data: program } = await supabase
    .from("affiliate_programs")
    .select("*, products(name, business_id)")
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

  const whatsappRef = generateWhatsAppRef();

  // Deliberately NOT storing fullName/phone/email here. The WhatsApp deep
  // link below already carries the name to the business the moment they
  // open the chat, and the business sees the phone number natively inside
  // WhatsApp — Commission does not need to (and does not) keep a copy.
  // This row only tracks the attribution/billing event.
  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      program_id: programId,
      click_id: clickId,
      enrollment_id: enrollment.id,
      whatsapp_ref: whatsappRef,
      status: "captured",
      forwarded_to: "none", // nothing to forward yet — the Intent Form step is what involves new information
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let whatsappNumber = program.whatsapp_number;
  if (!whatsappNumber) {
    const { data: business } = await supabase
      .from("businesses")
      .select("whatsapp_number")
      .eq("id", program.products.business_id)
      .maybeSingle();
    whatsappNumber = business?.whatsapp_number ?? null;
  }
  const whatsappLink = whatsappNumber
    ? buildLeadWhatsAppLink({
        whatsappNumber,
        whatsappRef,
        productName: program.products.name,
        leadName: fullName,
      })
    : null;

  return NextResponse.json({ leadId: lead.id, whatsappRef, whatsappLink });
}