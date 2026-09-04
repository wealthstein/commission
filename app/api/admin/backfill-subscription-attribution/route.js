import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { verifyTransaction } from "@/lib/paystack";

/**
 * POST /api/admin/backfill-subscription-attribution
 * body: { secret }
 *
 * Run this ONCE, only if there were live subscriptions sold before the
 * subscription_attribution fix existed (see app/api/paystack/webhook).
 * Without this, those existing subscriptions' renewal charges would hit
 * the "no attribution found" branch and be silently skipped for
 * commission purposes - the payment itself still succeeds on Paystack's
 * side either way, this only affects Commission's own bookkeeping.
 *
 * Reuses the SAME data already sitting in the transactions table - every
 * existing transaction's paystack_reference is re-verified with Paystack
 * (which returns the plan code and customer_code for subscription
 * purchases), and that's used to backfill subscription_attribution using
 * the campaign_id/enrollment_id/business_id already on file. No new
 * Paystack API surface needed beyond the verify call already built.
 *
 * Safe to run more than once - upserts on (customer_code, plan_code), and
 * skips any transaction whose Paystack reference wasn't actually
 * subscription-based (no plan code returned).
 */
export async function POST(req) {
  const { secret } = await req.json();
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: transactions } = await supabase
    .from("billing_transactions")
    .select("paystack_reference, campaign_id, enrollment_id, affiliate_campaigns(business_id)")
    .eq("source", "paystack")
    .eq("status", "success");

  let checked = 0;
  let backfilled = 0;
  let skippedNotSubscription = 0;
  const errors = [];

  for (const txn of transactions || []) {
    checked += 1;
    try {
      const verified = await verifyTransaction(txn.paystack_reference);
      if (!verified.plan || !verified.customer?.customer_code) {
        skippedNotSubscription += 1;
        continue;
      }

      const { error } = await supabase.from("subscription_attribution").upsert(
        {
          customer_code: verified.customer.customer_code,
          plan_code: typeof verified.plan === "string" ? verified.plan : verified.plan.plan_code,
          campaign_id: txn.campaign_id,
          enrollment_id: txn.enrollment_id,
          business_id: txn.campaigns.business_id,
        },
        { onConflict: "customer_code,plan_code" }
      );
      if (error) throw error;
      backfilled += 1;
    } catch (err) {
      errors.push({ reference: txn.paystack_reference, error: err.message });
    }
  }

  return NextResponse.json({ checked, backfilled, skippedNotSubscription, errors });
}
