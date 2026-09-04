import { calculateCommission } from "@/lib/commissionEngine";
import { chargeWallet } from "@/lib/wallet";
import { sendCommissionEarnedEmail } from "@/lib/email";

async function resolveLineage(admin, enrollment) {
  const chain = [enrollment];
  let current = enrollment;
  while (chain.length < 3 && current.referrer_enrollment_id) {
    const { data: parent } = await admin
      .from("affiliate_enrollments")
      .select("*")
      .eq("id", current.referrer_enrollment_id)
      .maybeSingle();
    if (!parent) break;
    chain.push(parent);
    current = parent;
  }
  return chain;
}

/**
 * Charges the wallet for one qualified lead, then pays affiliates in full
 * (platform fee is 0% here on purpose - Commission already took its cut
 * when the wallet was funded, see app/api/paystack/webhook). Shared by:
 *   - app/api/leads/[leadId]/qualify (business dashboard / CRM postback)
 *   - app/api/leads/continue (the public Intent Form a prospect fills out themselves)
 *
 * Throws if the wallet balance cannot cover the charge - the caller should
 * leave the lead as 'captured' in that case so it can be retried once the
 * business tops up.
 */
export async function qualifyLead(admin, { lead, program, business }) {
  const chargeAmount = Number(program.cost_per_qualified_lead_naira);

  await chargeWallet(admin, {
    businessId: business.id,
    amountNaira: -chargeAmount,
    type: "qualified_lead_charge",
    leadId: lead.id,
  });

  const { data: enrollment } = await admin.from("affiliate_enrollments").select("*").eq("id", lead.enrollment_id).single();
  const lineage = await resolveLineage(admin, enrollment);

  const result = calculateCommission({
    amountNaira: chargeAmount,
    program: { ...program, platform_fee_percent: 0 },
    sellingEnrollment: enrollment,
    lookupEnrollment: (id) => lineage.find((e) => e.id === id) ?? null,
  });

  const createdCommissions = [];
  for (const line of result.lines) {
    const { data: commission } = await admin
      .from("billing_commissions")
      .insert({
        lead_id: lead.id,
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
        .from("core_users")
        .select("email, full_name")
        .eq("id", lineEnrollment.affiliate_id)
        .maybeSingle();
      if (affiliateUser?.email) {
        await sendCommissionEarnedEmail({
          to: affiliateUser.email,
          name: affiliateUser.full_name,
          amountNaira: line.affiliatePayoutNaira,
          productName: program.campaigns?.name,
          tier: line.tier,
        });
      }
    }
  }

  return { chargeAmount, commissions: createdCommissions };
}
