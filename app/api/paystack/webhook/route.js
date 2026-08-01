import { NextResponse } from "next/server";
import { verifyPaystackSignature, verifyTransaction } from "@/lib/paystack";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { chargeWallet } from "@/lib/wallet";
import { calculateCommission } from "@/lib/commissionEngine";
import { feePercentForPlan } from "@/lib/pricingPlans";
import { sendCommissionEarnedEmail, sendPayoutPaidEmail } from "@/lib/email";

/**
 * POST /api/paystack/webhook
 *
 * charge.success can mean one of two different things, told apart by
 * metadata.purpose:
 *   'wallet_topup' -> a LEAD-goal business funding their Campaign Wallet.
 *     Credits the wallet, taking Commission's plan-based fee off the top.
 *   'direct_sale' -> a customer paying for a SALE-goal product through
 *     Commission's checkout (see lib/checkout.js). Paystack has ALREADY
 *     split this payment at settlement (see initializeDirectSaleCheckout) -
 *     the business's share went straight to their own subaccount, and the
 *     total affiliate commission stayed in Commission's main account. This
 *     handler's job is just bookkeeping: record the sale, create the
 *     per-tier commission ledger rows so the normal payout batch job can
 *     transfer each affiliate their share.
 * transfer.success / transfer.failed still just updates an affiliate
 * payout's status either way, unchanged.
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
        if (event.data.metadata?.purpose === "direct_sale") {
          await handleDirectSaleSuccess(event.data, supabase);
        } else {
          await handleWalletTopupSuccess(event.data, supabase);
        }
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
    // non-2xx, and a bug on our side should not hammer the endpoint. Alerting
    // (Sentry) should be wired in here for production.
    return NextResponse.json({ received: true, error: "internal" }, { status: 200 });
  }
}

async function handleWalletTopupSuccess(data, supabase) {
  if (data.metadata?.purpose !== "wallet_topup") {
    console.warn(`Ignoring charge.success with unrecognized purpose: ${data.metadata?.purpose}. reference=${data.reference}`);
    return;
  }

  // Defense in depth: re-verify with Paystack directly rather than trusting the payload alone.
  const verified = await verifyTransaction(data.reference);
  if (verified.status !== "success") return;

  const businessId = data.metadata.business_id;
  const grossAmountNaira = verified.amount / 100;

  // Idempotency: if this reference already produced a wallet_transactions row, skip.
  const { data: existing } = await supabase
    .from("wallet_transactions")
    .select("id")
    .eq("paystack_reference", data.reference)
    .maybeSingle();
  if (existing) return;

  // The platform fee is taken RIGHT HERE, at top-up time — Small keeps 20%
  // for Commission, Medium 15%, Large 10% — not per-lead or per-sale. Every
  // qualified lead or verified sale afterward deducts its FULL commission
  // straight to affiliates with no further fee (see the qualify/verify routes).
  const { data: business } = await supabase.from("businesses").select("plan").eq("id", businessId).single();
  const feePercent = feePercentForPlan(business?.plan);
  const platformFeeNaira = Math.round((grossAmountNaira * feePercent) / 100 * 100) / 100;
  const netCreditedNaira = Math.round((grossAmountNaira - platformFeeNaira) * 100) / 100;

  await chargeWallet(supabase, {
    businessId,
    amountNaira: netCreditedNaira, // positive = credit; already net of the fee
    type: "topup",
    paystackReference: data.reference,
    grossAmountNaira,
    platformFeeNaira,
  });
}

async function handleDirectSaleSuccess(data, supabase) {
  // Defense in depth: re-verify with Paystack directly rather than trusting the payload alone.
  const verified = await verifyTransaction(data.reference);
  if (verified.status !== "success") return;

  const productId = data.metadata.product_id;
  const referralCode = data.metadata.referral_code;
  const amountNaira = verified.amount / 100;

  // Idempotency: if this reference already produced a transaction, skip.
  const { data: existingTxn } = await supabase
    .from("transactions")
    .select("id")
    .eq("paystack_reference", data.reference)
    .maybeSingle();
  if (existingTxn) return;

  const { data: product } = await supabase.from("products").select("*, businesses(*)").eq("id", productId).single();
  const business = product.businesses;

  const { data: customer } = await supabase
    .from("customers")
    .upsert(
      { business_id: business.id, email: verified.customer.email, paystack_customer_code: verified.customer.customer_code },
      { onConflict: "business_id,email" }
    )
    .select()
    .single();

  let enrollment = null;
  if (referralCode) {
    const { data: enr } = await supabase.from("affiliate_enrollments").select("*").eq("referral_code", referralCode).maybeSingle();
    enrollment = enr;
  }

  const { data: transaction } = await supabase
    .from("transactions")
    .insert({
      product_id: productId,
      customer_id: customer.id,
      enrollment_id: enrollment?.id ?? null,
      paystack_reference: data.reference,
      amount_naira: amountNaira,
      status: "success",
      source: "paystack",
    })
    .select()
    .single();

  // No referring affiliate on this sale — nothing further to calculate.
  // The customer's full payment already landed with the business via their
  // subaccount (no transaction_charge was set for an unreferred checkout).
  if (!enrollment) return;

  const { data: program } = await supabase
    .from("affiliate_programs")
    .select("*")
    .eq("product_id", productId)
    .eq("status", "active")
    .maybeSingle();
  if (!program) return;

  const feePercent = feePercentForPlan(business.plan);
  const lookupEnrollment = async (id) => {
    const { data } = await supabase.from("affiliate_enrollments").select("*").eq("id", id).maybeSingle();
    return data;
  };
  const lineage = [enrollment];
  let current = enrollment;
  while (lineage.length < 3 && current.referrer_enrollment_id) {
    const parent = await lookupEnrollment(current.referrer_enrollment_id);
    if (!parent) break;
    lineage.push(parent);
    current = parent;
  }

  const result = calculateCommission({
    amountNaira,
    program: { ...program, platform_fee_percent: feePercent },
    sellingEnrollment: enrollment,
    lookupEnrollment: (id) => lineage.find((e) => e.id === id) ?? null,
  });

  for (const line of result.lines) {
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

    const lineEnrollment = lineage.find((e) => e.id === line.enrollmentId);
    if (lineEnrollment?.affiliate_id) {
      const { data: affiliateUser } = await supabase
        .from("users")
        .select("email, full_name")
        .eq("id", lineEnrollment.affiliate_id)
        .maybeSingle();
      if (affiliateUser?.email) {
        await sendCommissionEarnedEmail({
          to: affiliateUser.email,
          name: affiliateUser.full_name,
          amountNaira: line.affiliatePayoutNaira,
          productName: product.name,
          tier: line.tier,
        });
      }
    }
  }
}

async function handleTransferStatus(data, eventName, supabase) {
  const status = eventName === "transfer.success" ? "paid" : "failed";
  const { data: payout } = await supabase
    .from("payouts")
    .update({ status, paid_at: status === "paid" ? new Date().toISOString() : null })
    .eq("paystack_transfer_code", data.transfer_code)
    .select()
    .single();

  if (status === "paid" && payout) {
    await supabase
      .from("commissions")
      .update({ payout_status: "paid" })
      .eq("paystack_transfer_code", data.transfer_code);

    const { data: affiliate } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", payout.affiliate_id)
      .maybeSingle();

    if (affiliate?.email) {
      await sendPayoutPaidEmail({ to: affiliate.email, name: affiliate.full_name, amountNaira: payout.amount_naira });
    }
  }
}
