import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * POST /api/sales/report
 * body: { campaignId, customerEmail, amountNaira, referralCode?, proofUrl? }
 *
 * For 'sale'-goal campaigns (see affiliate_programs.conversion_goal). Since
 * the customer always pays the business directly — there is no Paystack
 * webhook to trigger commission calculation automatically for ANY campaign,
 * physical or digital. The business logs the sale here — it lands as
 * 'pending' verification. Nothing is owed to any affiliate yet; that only
 * happens once the business confirms it via POST /api/sales/[id]/verify,
 * which is what actually charges the wallet.
 */
export async function POST(req) {
  const { campaignId, customerEmail, amountNaira, referralCode, proofUrl } = await req.json();

  if (!campaignId || !customerEmail || !amountNaira) {
    return NextResponse.json({ error: "campaignId, customerEmail, and amountNaira are required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: reporterUser } = await supabase.from("users").select("id").eq("auth_user_id", authUser.id).single();

  const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", campaignId).single();
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const { data: program } = await supabase
    .from("affiliate_programs")
    .select("conversion_goal")
    .eq("campaign_id", campaignId)
    .eq("status", "active")
    .maybeSingle();
  if (!program || program.conversion_goal !== "sale") {
    return NextResponse.json(
      { error: "This campaign is not a sale-goal campaign — use the lead capture flow instead." },
      { status: 400 }
    );
  }

  // Resolve the referring affiliate, if any, the same way the lead-capture flow does.
  let enrollment = null;
  if (referralCode) {
    const { data: enr } = await supabase
      .from("affiliate_enrollments")
      .select("id")
      .eq("referral_code", referralCode)
      .maybeSingle();
    enrollment = enr;
  }

  const { data: customer } = await supabase
    .from("customers")
    .upsert(
      { business_id: campaign.business_id, email: customerEmail, attributed_enrollment_id: enrollment?.id ?? null },
      { onConflict: "business_id,email" }
    )
    .select()
    .single();

  const { data: transaction, error: txnError } = await supabase
    .from("transactions")
    .insert({
      campaign_id: campaignId,
      customer_id: customer.id,
      enrollment_id: enrollment?.id ?? null,
      amount_naira: amountNaira,
      status: "pending",
      verification_status: "pending",
      proof_url: proofUrl ?? null,
      reported_by: reporterUser.id,
    })
    .select()
    .single();
  if (txnError) {
    return NextResponse.json({ error: txnError.message }, { status: 500 });
  }

  return NextResponse.json({ transaction });
}
