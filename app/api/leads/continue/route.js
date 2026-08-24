import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { qualifyLead } from "@/lib/leadQualification";
import { forwardLeadToBusiness } from "@/lib/leadForwarding";

/**
 * POST /api/leads/continue
 * body: { leadRef, fullName, phone, email?, details?, customFieldAnswers? }
 * customFieldAnswers: [{ fieldId, label, value }]
 *
 * The "Intent Form" step of the funnel: Interest Form -> (inline OTP for
 * unproven affiliates) -> Intent Form (this) -> Thank You. Submitting this
 * is what makes a lead billable - the prospect is providing NEW
 * information here (Commission only ever had the Interest Form's name/
 * phone, never stored), so it gets forwarded straight to the business
 * (their email or CRM webhook) and then discarded - never written to
 * Commission's own database. Custom field ANSWERS get the identical
 * treatment - only the business's own QUESTIONS (campaign_custom_fields)
 * are stored, never a prospect's answers.
 */
export async function POST(req) {
  const { leadRef, fullName, phone, email, details, customFieldAnswers } = await req.json();
  if (!leadRef || !fullName || !phone) {
    return NextResponse.json({ error: "leadRef, fullName, and phone are required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: lead } = await admin.from("leads").select("*").eq("lead_ref", leadRef).maybeSingle();
  if (!lead) {
    return NextResponse.json({ error: "This link is no longer valid" }, { status: 404 });
  }
  if (lead.status !== "captured") {
    return NextResponse.json({ error: `This lead is already ${lead.status}` }, { status: 400 });
  }

  const { data: program } = await admin
    .from("affiliate_programs")
    .select("*, campaigns(name, business_id, businesses(*))")
    .eq("id", lead.program_id)
    .single();
  const business = program.campaigns.businesses;

  // Validate any required custom questions this campaign's business defined -
  // done here, not just client-side, since this is the actual billable moment.
  const { data: fields } = await admin
    .from("campaign_custom_fields")
    .select("id, label, required")
    .eq("affiliate_program_id", program.id);
  const answered = new Map((customFieldAnswers || []).map((a) => [a.fieldId, a.value]));
  const missingRequired = (fields || []).filter((f) => f.required && !answered.get(f.id)?.trim?.());
  if (missingRequired.length > 0) {
    return NextResponse.json(
      { error: `Please answer: ${missingRequired.map((f) => f.label).join(", ")}` },
      { status: 400 }
    );
  }

  // 1. Charge the wallet + run the commission engine FIRST. If the business
  // cannot afford it, nothing is charged and the lead stays 'captured' so
  // it can be retried once they top up - the prospect sees a friendly
  // "please try again shortly" rather than a technical error.
  let chargeAmount;
  try {
    const result = await qualifyLead(admin, { lead, program, business });
    chargeAmount = result.chargeAmount;
  } catch (err) {
    return NextResponse.json(
      { error: "This campaign cannot accept new leads right now - please try again shortly." },
      { status: 503 }
    );
  }

  // 2. Forward the full lead details to the business - the only place they
  // ever get written down. Commission's own leads row never sees them.
  const { data: businessOwner } = await admin.from("businesses").select("owner_id").eq("id", business.id).single();
  const { data: ownerRow } = await admin.from("users").select("email").eq("id", businessOwner?.owner_id).maybeSingle();

  // Real estate only (see requiresAffiliateContactSharing) - the referring
  // affiliate gets the same contact details as the business, so they can
  // track their own deal through to close. Fetched regardless of industry;
  // forwardLeadToBusiness itself decides whether to actually use it.
  const { data: enrollment } = await admin
    .from("affiliate_enrollments")
    .select("affiliate_id")
    .eq("id", lead.enrollment_id)
    .single();
  const { data: affiliateUser } = await admin
    .from("users")
    .select("email, full_name")
    .eq("id", enrollment?.affiliate_id)
    .maybeSingle();

  const forwardedTo = await forwardLeadToBusiness(admin, {
    business,
    ownerEmail: ownerRow?.email,
    productName: program.campaigns.name,
    fullName,
    phone,
    email,
    details,
    customFieldAnswers,
    affiliateEmail: affiliateUser?.email,
    affiliateName: affiliateUser?.full_name,
  });

  // 3. Mark the lead qualified now that everything above succeeded.
  await admin
    .from("leads")
    .update({
      status: "qualified",
      qualified_at: new Date().toISOString(),
      charge_amount_naira: chargeAmount,
      forwarded_to: forwardedTo,
    })
    .eq("id", lead.id);

  return NextResponse.json({ status: "qualified" });
}
