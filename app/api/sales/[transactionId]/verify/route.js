import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabaseServer";
import { calculateCommission } from "@/lib/commissionEngine";
import { chargeWallet } from "@/lib/wallet";
import { sendCommissionEarnedEmail } from "@/lib/email";

/**
 * POST /api/sales/[transactionId]/verify
 * body: { approve: boolean }
 *
 * FALLBACK PATH for a 'sale'-goal campaign. The primary mechanism is now
 * the live Commission-hosted checkout (see lib/checkout.js, triggered from
 * app/r/[code]) — Paystack splits the payment automatically the moment the
 * customer pays, no manual step required. This route exists for the edge
 * case of a sale that happened OFF that checkout (e.g. the business closed
 * the deal another way) and still needs the affiliate paid: the business
 * self-reports it (app/api/sales/report), then confirms it here, which
 * charges their Campaign Wallet for the commission owed and runs the
 * commission engine — same "charge first, only persist on success" pattern
 * as lead qualification.
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
    .select("*, campaigns(*, businesses(*))")
    .eq("id", params.transactionId)
    .single();

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }
  if (transaction.verification_status !== "pending") {
    return NextResponse.json({ error: `Already ${transaction.verification_status}` }, { status: 400 });
  }

  if (!approve) {
    await admin.from("transactions").update({ verification_status: "rejected", status: "failed" }).eq("id", transaction.id);
    return NextResponse.json({ status: "rejected" });
  }

  const business = transaction.campaigns.businesses;

  // No affiliate on this sale — nothing owed, nothing to charge. Just confirm it happened.
  if (!transaction.enrollment_id) {
    await admin.from("transactions").update({ verification_status: "verified", status: "success" }).eq("id", transaction.id);
    return NextResponse.json({ status: "verified", commissions: [] });
  }

  const { data: program } = await admin
    .from("affiliate_programs")
    .select("*")
    .eq("campaign_id", transaction.campaign_id)
    .eq("status", "active")
    .maybeSingle();
  if (!program) {
    await admin.from("transactions").update({ verification_status: "verified", status: "success" }).eq("id", transaction.id);
    return NextResponse.json({ status: "verified", commissions: [], note: "No active affiliate program on this campaign" });
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
  const lineage = await resolveLineage(enrollment, lookupEnrollment);

  const result = calculateCommission({
    amountNaira: transaction.amount_naira,
    program: { ...program, platform_fee_percent: 0 },
    sellingEnrollment: enrollment,
    lookupEnrollment: (id) => lineage.find((e) => e.id === id) ?? null,
  });

  // The wallet is charged exactly what affiliates receive — Commission's
  // fee was already taken when this wallet was funded (see
  // app/api/paystack/webhook), so nothing further is skimmed here.
  try {
    await chargeWallet(admin, {
      businessId: business.id,
      amountNaira: -result.totalAffiliatePayoutNaira,
      type: "sale_charge",
      transactionId: transaction.id,
    });
  } catch (err) {
    return NextResponse.json({ error: `Could not verify: ${err.message}` }, { status: 402 });
  }

  await admin.from("transactions").update({ verification_status: "verified", status: "success" }).eq("id", transaction.id);

  const createdCommissions = [];
  for (const line of result.lines) {
    const { data: commission } = await admin
      .from("commissions")
      .insert({
        transaction_id: transaction.id,
        enrollment_id: line.enrollmentId,
        tier: line.tier,
        commission_percent: line.commissionPercent,
        commission_amount_naira: line.commissionNaira,
        platform_fee_percent: line.platformFeePercent,
        platform_fee_naira: line.platformFeeNaira,
        affiliate_payout_naira: line.affiliatePayoutNaira,
        payout_status: "pending",
      })
      .select()
      .single();
    createdCommissions.push(commission);

    const lineEnrollment = lineage.find((e) => e.id === line.enrollmentId);
    if (lineEnrollment?.affiliate_id) {
      const { data: affiliateUser } = await admin
        .from("users")
        .select("email, full_name")
        .eq("id", lineEnrollment.affiliate_id)
        .maybeSingle();
      if (affiliateUser?.email) {
        await sendCommissionEarnedEmail({
          to: affiliateUser.email,
          name: affiliateUser.full_name,
          amountNaira: line.affiliatePayoutNaira,
          productName: transaction.campaigns.name,
          tier: line.tier,
        });
      }
    }
  }

  return NextResponse.json({ status: "verified", commissions: createdCommissions });
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
