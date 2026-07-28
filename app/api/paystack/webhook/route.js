import { NextResponse } from "next/server";
import { verifyPaystackSignature, verifyTransaction } from "@/lib/paystack";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { calculateCommission, commissionIdempotencyKey } from "@/lib/commissionEngine";

/**
 * POST /api/paystack/webhook
 *
 * Implements the flow from the TRD, section 5:
 *   Customer -> Paystack -> Commission identifies referring affiliate ->
 *   commission engine calculates tier 1/2/3 -> platform fee calculated ->
 *   affiliate payouts initiated -> business receives sale proceeds.
 *
 * Handles charge.success (one-time or a recurring cycle) and
 * charge.failed / refund events for the failed/refunded path.
 */
export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!signature || !verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const supabase = createAdminSupabaseClient();

  try {
    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(event.data, supabase);
        break;
      case "charge.failed":
        await handleChargeFailed(event.data, supabase);
        break;
      case "refund.processed":
        await handleRefund(event.data, supabase);
        break;
      case "transfer.success":
      case "transfer.failed":
        await handleTransferStatus(event.data, event.event, supabase);
        break;
      default:
        // Unhandled event types are acknowledged but ignored.
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Paystack webhook error:", err);
    // Return 200 anyway after logging — Paystack retries aggressively on
    // non-2xx, and a bug on our side shouldn't hammer the endpoint. Alerting
    // (Sentry) should be wired in here for production.
    return NextResponse.json({ received: true, error: "internal" }, { status: 200 });
  }
}

async function handleChargeSuccess(data, supabase) {
  // Defense in depth: re-verify with Paystack directly rather than trusting the payload alone.
  const verified = await verifyTransaction(data.reference);
  if (verified.status !== "success") return;

  const referralCode = data.metadata?.referral_code;
  const productId = data.metadata?.product_id;
  const amountNaira = verified.amount / 100;

  // Idempotency: if we've already recorded this Paystack reference, skip.
  const { data: existingTxn } = await supabase
    .from("transactions")
    .select("id")
    .eq("paystack_reference", data.reference)
    .maybeSingle();
  if (existingTxn) return;

  // 1. Identify the referring affiliate's enrollment.
  let enrollment = null;
  if (referralCode) {
    const { data: enr } = await supabase
      .from("affiliate_enrollments")
      .select("*")
      .eq("referral_code", referralCode)
      .maybeSingle();
    enrollment = enr;
  }

  // 2. Load the product + its active affiliate program.
  const { data: product } = await supabase.from("products").select("*").eq("id", productId).single();
  const { data: program } = await supabase
    .from("affiliate_programs")
    .select("*")
    .eq("product_id", productId)
    .eq("status", "active")
    .maybeSingle();

  // 3. Upsert the customer record (attribution is last-touch: current referral wins).
  const { data: customer } = await supabase
    .from("customers")
    .upsert(
      {
        business_id: product.business_id,
        email: verified.customer.email,
        paystack_customer_code: verified.customer.customer_code,
        attributed_enrollment_id: enrollment?.id ?? null,
      },
      { onConflict: "business_id,email" }
    )
    .select()
    .single();

  // 4. Record the transaction.
  const { data: transaction } = await supabase
    .from("transactions")
    .insert({
      product_id: productId,
      customer_id: customer.id,
      enrollment_id: enrollment?.id ?? null,
      paystack_reference: data.reference,
      amount_naira: amountNaira,
      status: "success",
      is_recurring_cycle: product.billing_frequency !== "one_time" && !!data.metadata?.is_recurring_cycle,
    })
    .select()
    .single();

  // No affiliate involved (direct/organic sale) — nothing further to calculate.
  if (!enrollment || !program) return;

  // 5-7. Commission engine: calculate tier 1/2/3 + platform fee.
  const lookupEnrollment = async (id) => {
    const { data } = await supabase.from("affiliate_enrollments").select("*").eq("id", id).maybeSingle();
    return data;
  };
  // calculateCommission expects a sync lookup; pre-resolve the lineage via async walk here instead.
  const lineageIds = await resolveLineage(enrollment, lookupEnrollment);
  const result = calculateCommission({
    amountNaira,
    program,
    sellingEnrollment: enrollment,
    lookupEnrollment: (id) => lineageIds.find((e) => e.id === id) ?? null,
  });

  // 8. Persist one commission ledger row per tier and initiate payouts.
  for (const line of result.lines) {
    const idempotencyKey = commissionIdempotencyKey(data.reference, line.tier);
    await supabase.from("commissions").upsert(
      {
        transaction_id: transaction.id,
        enrollment_id: line.enrollmentId,
        tier: line.tier,
        commission_percent: line.commissionPercent,
        commission_amount_naira: line.commissionNaira,
        platform_fee_percent: line.platformFeePercent,
        platform_fee_naira: line.platformFeeNaira,
        affiliate_payout_naira: line.affiliatePayoutNaira,
        payout_status: "pending",
      },
      { onConflict: "transaction_id,tier" }
    );
    void idempotencyKey; // reserved for a dedicated idempotency-keys table if needed at scale
  }

  // 9. Business proceeds settlement is handled by Paystack's split/subaccount
  // config on the transaction itself (see businesses.paystack_subaccount_code).
}

async function resolveLineage(enrollment, lookupEnrollment) {
  const chain = [enrollment];
  let current = enrollment;
  while (chain.length < 3 && current.referrer_enrollment_id) {
    const parent = await lookupEnrollment(current.referrer_enrollment_id);
    if (!parent) break;
    chain.push(parent);
    current = parent;
  }
  return chain;
}

async function handleChargeFailed(data, supabase) {
  await supabase.from("transactions").update({ status: "failed" }).eq("paystack_reference", data.reference);
}

async function handleRefund(data, supabase) {
  const { data: transaction } = await supabase
    .from("transactions")
    .update({ status: "refunded" })
    .eq("paystack_reference", data.transaction_reference)
    .select()
    .single();

  if (transaction) {
    // Reverse any commissions tied to this transaction that haven't been paid out yet.
    await supabase
      .from("commissions")
      .update({ payout_status: "reversed" })
      .eq("transaction_id", transaction.id)
      .in("payout_status", ["pending", "initiated"]);
  }
}

async function handleTransferStatus(data, eventName, supabase) {
  const status = eventName === "transfer.success" ? "paid" : "failed";
  await supabase
    .from("payouts")
    .update({ status, paid_at: status === "paid" ? new Date().toISOString() : null })
    .eq("paystack_transfer_code", data.transfer_code);
}
