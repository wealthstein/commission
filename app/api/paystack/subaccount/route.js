import { NextResponse } from "next/server";
import { resolveAccountNumber, createBusinessSubaccount } from "@/lib/paystack";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * POST /api/paystack/subaccount
 * body: { businessId, bankCode, accountNumber }
 *
 * Verifies the account resolves to a real name, creates a Paystack
 * subaccount for the business, and stores the subaccount code so future
 * checkouts for this business's products settle directly to them
 * (TRD section 5, "the business receives the product-sale proceeds
 * according to the configured settlement model").
 */
export async function POST(req) {
  const { businessId, bankCode, accountNumber } = await req.json();

  if (!businessId || !bankCode || !accountNumber) {
    return NextResponse.json({ error: "businessId, bankCode, and accountNumber are required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  // Confirm the caller actually owns this business — RLS also enforces this
  // on the update below, but failing fast here gives a clearer error.
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("id", businessId)
    .single();
  if (bizError || !business) {
    return NextResponse.json({ error: "Business not found or you don't have access to it" }, { status: 404 });
  }

  try {
    const resolved = await resolveAccountNumber({ accountNumber, bankCode });

    const subaccount = await createBusinessSubaccount({
      businessName: business.name,
      bankCode,
      accountNumber,
      percentageChargeToBusiness: 0,
    });

    const { error: updateError } = await supabase
      .from("businesses")
      .update({ paystack_subaccount_code: subaccount.subaccount_code })
      .eq("id", businessId);
    if (updateError) throw updateError;

    return NextResponse.json({
      subaccountCode: subaccount.subaccount_code,
      accountName: resolved.account_name,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
