import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * POST /api/sales/report
 * body: { productId, customerEmail, amountNaira, referralCode?, proofUrl? }
 *
 * PHYSICAL PRODUCTS ONLY. Since the customer pays the business directly
 * (Commission never processes the charge), there's no webhook to trigger
 * commission calculation automatically. Instead the business logs the sale
 * here — it lands as 'pending' verification. Nothing is owed to any
 * affiliate yet; that only happens once the business confirms the sale via
 * POST /api/sales/[transactionId]/verify (matching the "Business confirms
 * sale" step in the physical-product flow).
 */
export async function POST(req) {
  const { productId, customerEmail, amountNaira, referralCode, proofUrl } = await req.json();

  if (!productId || !customerEmail || !amountNaira) {
    return NextResponse.json({ error: "productId, customerEmail, and amountNaira are required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: reporterUser } = await supabase.from("users").select("id").eq("auth_user_id", authUser.id).single();

  const { data: product } = await supabase.from("products").select("*").eq("id", productId).single();
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  if (product.product_type !== "physical") {
    return NextResponse.json(
      { error: "Only physical products use manual sale reporting — digital sales are captured automatically via Paystack." },
      { status: 400 }
    );
  }

  // Resolve the referring affiliate, if any, the same way the Paystack webhook does.
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
      { business_id: product.business_id, email: customerEmail, attributed_enrollment_id: enrollment?.id ?? null },
      { onConflict: "business_id,email" }
    )
    .select()
    .single();

  const { data: transaction, error: txnError } = await supabase
    .from("transactions")
    .insert({
      product_id: productId,
      customer_id: customer.id,
      enrollment_id: enrollment?.id ?? null,
      paystack_reference: null,
      amount_naira: amountNaira,
      status: "pending",
      source: "manual",
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
