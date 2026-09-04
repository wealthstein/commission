import { NextResponse } from "next/server";
import { resolveAccountNumber, createBusinessSubaccount } from "@/lib/paystack";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * POST /api/paystack/subaccount
 * body: { businessId, bankCode, accountNumber }
 *
 * Required before a business can run a SALE-goal campaign — see
 * lib/checkout.js, which refuses to initialize a checkout without this set.
 * Not needed at all for LEAD-goal campaigns (those use the Campaign Wallet
 * instead).
 */
export async function POST(req) {
  const { businessId, bankCode, accountNumber } = await req.json();
  if (!businessId || !bankCode || !accountNumber) {
    return NextResponse.json({ error: "businessId, bankCode, and accountNumber are required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data: business, error: bizError } = await supabase.from("core_businesses").select("id, name").eq("id", businessId).single();
  if (bizError || !business) {
    return NextResponse.json({ error: "Business not found or you do not have access to it" }, { status: 404 });
  }

  try {
    const resolved = await resolveAccountNumber({ accountNumber, bankCode });
    const subaccount = await createBusinessSubaccount({ businessName: business.name, bankCode, accountNumber });

    const { error: updateError } = await supabase
      .from("core_businesses")
      .update({ paystack_subaccount_code: subaccount.subaccount_code })
      .eq("id", businessId);
    if (updateError) throw updateError;

    return NextResponse.json({ subaccountCode: subaccount.subaccount_code, accountName: resolved.account_name });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
