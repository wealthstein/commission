import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabaseServer";
import { calculateCommission } from "@/lib/commissionEngine";
import { feePercentForPlan } from "@/lib/pricingPlans";
import { sendCommissionEarnedEmail } from "@/lib/email";

/**
 * POST /api/sales/[transactionId]/verify
 * body: { approve: boolean }
 *
 * The "Business confirms sale" step of the physical-product flow:
 *   Customer pays business directly -> Business fulfills order ->
 *   Business confirms sale -> Commission calculates affiliate commissions.
 *
 * Only once a manually-reported sale is verified do commission ledger rows
 * get created. Physical products always resolve to a 0% platform fee
 * (feePercentForPlan forces this) — Commission's revenue on physical
 * products is the subscription alone, never a cut of the affiliate payout.
 */
export async function POST(req, { params }) {
  const { approve } = await req.json();
  const supabase = createServerSupabaseClient();
  const admin = createAdminSupabaseClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: transaction } = await admin
    .from("transactions")
    .select("*, products(*, businesses(*))")
    .eq("id", params.transactionId)
    .single();

  if (!transaction || transaction.source !== "manual") {
    return NextResponse.json({ error: "Manually-reported transaction not found" }, { status: 404 });
  }
  if (transaction.verification_status !== "pending") {
    return NextResponse.json({ error: `Already ${transaction.verification_status}` }, { status: 400 });
  }

  if (!approve) {
    await admin.from("transactions").update({ verification_status: "rejected", status: "failed" }).eq("id", transaction.id);
    return NextResponse.json({ status: "rejected" });
  }

  await admin.from("transactions").update({ verification_status: "verified", status: "success" }).eq("id", transaction.id);

  // No affiliate on this sale — nothing further to calculate.
  if (!transaction.enrollment_id) {
    return NextResponse.json({ status: "verified", commissions: [] });
  }

  const business = transaction.products.businesses;
  const platformFeePercent = feePercentForPlan(business.plan, transaction.products.product_type); // always 0 for physical

  const { data: program } = await admin
    .from("affiliate_programs")
    .select("*")
    .eq("product_id", transaction.product_id)
    .eq("status", "active")
    .maybeSingle();
  if (!program) {
    return NextResponse.json({ status: "verified", commissions: [], note: "No active affiliate program on this product" });
  }

  const { data: enrollment } = await admin
    .from("affiliate_enrollments")
    .select("*")
    .eq("id", transaction.enrollment_id)
    .single();

  const lookupEnrollment = async (id) => {
    const { data } = await admin.from("affiliate_enrollments").select("*").eq("id", id).maybeSingle();
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
    amountNaira: transaction.amount_naira,
    program: { ...program, platform_fee_percent: platformFeePercent },
    sellingEnrollment: enrollment,
    lookupEnrollment: (id) => lineage.find((e) => e.id === id) ?? null,
  });

  // Physical products: who's actually responsible for paying the affiliate?
  const payoutStatus = business.physical_payout_mode === "commission_facilitates" ? "pending" : "business_handles";

  const createdCommissions = [];
  for (const line of result.lines) {
    const { data: commission } = await admin
      .from("commissions")
      .upsert(
        {
          transaction_id: transaction.id,
          enrollment_id: line.enrollmentId,
          tier: line.tier,
          commission_percent: line.commissionPercent,
          commission_amount_naira: line.commissionNaira,
          platform_fee_percent: line.platformFeePercent,
          platform_fee_naira: line.platformFeeNaira,
          affiliate_payout_naira: line.affiliatePayoutNaira,
          payout_status: payoutStatus,
        },
        { onConflict: "transaction_id,tier" }
      )
      .select()
      .single();
    createdCommissions.push(commission);

    const { data: affiliateUser } = await admin
      .from("users")
      .select("email, full_name")
      .eq("id", line.enrollmentId ? lineage.find((e) => e.id === line.enrollmentId)?.affiliate_id : null)
      .maybeSingle();
    if (affiliateUser?.email) {
      await sendCommissionEarnedEmail({
        to: affiliateUser.email,
        name: affiliateUser.full_name,
        amountNaira: line.affiliatePayoutNaira,
        productName: transaction.products.name,
        tier: line.tier,
      });
    }
  }

  return NextResponse.json({ status: "verified", commissions: createdCommissions, payoutStatus });
}
