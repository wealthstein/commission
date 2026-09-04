import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { initializeWalletTopup } from "@/lib/paystack";

const MIN_TOPUP_NAIRA = 250000;

/**
 * POST /api/wallet/topup
 * body: { businessId, amountNaira }
 *
 * Returns a Paystack authorization_url to redirect the business to. On
 * successful payment, app/api/paystack/webhook credits the wallet.
 */
export async function POST(req) {
  const { businessId, amountNaira } = await req.json();
  if (!businessId || !amountNaira || amountNaira <= 0) {
    return NextResponse.json({ error: "businessId and a positive amountNaira are required" }, { status: 400 });
  }
  if (amountNaira < MIN_TOPUP_NAIRA) {
    return NextResponse.json({ error: `Minimum top-up is ₦${MIN_TOPUP_NAIRA.toLocaleString()}` }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Confirm the caller actually owns this business (RLS would also block a
  // mismatched business's row, but this gives a clearer error message).
  const { data: business } = await supabase.from("core_businesses").select("id").eq("id", businessId).single();
  if (!business) {
    return NextResponse.json({ error: "Business not found or you do not have access to it" }, { status: 404 });
  }

  try {
    const { authorization_url, reference } = await initializeWalletTopup({
      email: authUser.email,
      amountNaira,
      businessId,
    });
    return NextResponse.json({ authorizationUrl: authorization_url, reference });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
