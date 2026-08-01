import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { initiateTransfer } from "@/lib/paystack";
import { sendPayoutInitiatedEmail } from "@/lib/email";

/**
 * POST /api/payouts/run
 *
 * Intended to run on a schedule (see vercel.json — daily cron). Batches
 * every affiliate's pending commissions into one transfer each, respecting
 * each program's minimum payout threshold (TRD section 11), and initiates
 * the Paystack transfer.
 *
 * Protect this route with CRON_SECRET so it cannot be triggered by anyone
 * who finds the URL.
 */
// Vercel Cron Jobs call scheduled routes with GET; POST is kept for manual/admin triggering.
export async function GET(req) {
  return runPayoutBatch(req);
}

export async function POST(req) {
  return runPayoutBatch(req);
}

async function runPayoutBatch(req) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const summary = { affiliatesPaid: 0, affiliatesSkippedNoRecipient: 0, affiliatesBelowThreshold: 0, totalNaira: 0, errors: [] };

  // 1. Pull every pending commission with enough context to group and gate it.
  const { data: pending, error } = await supabase
    .from("commissions")
    .select(
      `
      id, affiliate_payout_naira, payout_status,
      affiliate_enrollments!inner (
        id, affiliate_id, program_id,
        affiliate_programs!inner ( id, min_payout_naira )
      )
    `
    )
    .eq("payout_status", "pending");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. Group by (affiliate, program) to evaluate each program's min payout threshold independently.
  const byAffiliateProgram = new Map(); // key: `${affiliateId}:${programId}` -> { affiliateId, minPayout, rows: [] }
  for (const row of pending) {
    const affiliateId = row.affiliate_enrollments.affiliate_id;
    const programId = row.affiliate_enrollments.program_id;
    const minPayout = row.affiliate_enrollments.affiliate_programs.min_payout_naira || 0;
    const key = `${affiliateId}:${programId}`;
    if (!byAffiliateProgram.has(key)) {
      byAffiliateProgram.set(key, { affiliateId, minPayout, rows: [] });
    }
    byAffiliateProgram.get(key).rows.push(row);
  }

  // 3. Roll qualifying (threshold-met) groups up into one payout per affiliate.
  const byAffiliate = new Map(); // affiliateId -> { commissionIds: [], totalNaira: 0 }
  for (const group of byAffiliateProgram.values()) {
    const subtotal = group.rows.reduce((s, r) => s + Number(r.affiliate_payout_naira), 0);
    if (subtotal < group.minPayout) {
      summary.affiliatesBelowThreshold += 1;
      continue;
    }
    if (!byAffiliate.has(group.affiliateId)) {
      byAffiliate.set(group.affiliateId, { commissionIds: [], totalNaira: 0 });
    }
    const entry = byAffiliate.get(group.affiliateId);
    entry.commissionIds.push(...group.rows.map((r) => r.id));
    entry.totalNaira += subtotal;
  }

  // 4. For each affiliate with a qualifying balance, initiate one transfer.
  for (const [affiliateId, entry] of byAffiliate.entries()) {
    const { data: affiliate } = await supabase
      .from("users")
      .select("id, email, full_name, paystack_recipient_code")
      .eq("id", affiliateId)
      .single();

    if (!affiliate?.paystack_recipient_code) {
      summary.affiliatesSkippedNoRecipient += 1;
      continue;
    }

    try {
      const { data: payout, error: payoutError } = await supabase
        .from("payouts")
        .insert({
          affiliate_id: affiliateId,
          amount_naira: entry.totalNaira,
          status: "initiated",
          initiated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (payoutError) throw payoutError;

      await supabase.from("payout_commissions").insert(
        entry.commissionIds.map((commissionId) => ({ payout_id: payout.id, commission_id: commissionId }))
      );

      const transfer = await initiateTransfer({
        amountNaira: entry.totalNaira,
        recipientCode: affiliate.paystack_recipient_code,
        reason: "Commission affiliate payout",
      });

      await supabase
        .from("payouts")
        .update({ paystack_transfer_code: transfer.transfer_code })
        .eq("id", payout.id);

      await supabase
        .from("commissions")
        .update({ payout_status: "initiated", paystack_transfer_code: transfer.transfer_code })
        .in("id", entry.commissionIds);

      await sendPayoutInitiatedEmail({
        to: affiliate.email,
        name: affiliate.full_name,
        amountNaira: entry.totalNaira,
      });

      summary.affiliatesPaid += 1;
      summary.totalNaira += entry.totalNaira;
    } catch (err) {
      summary.errors.push({ affiliateId, message: err.message });
    }
  }

  return NextResponse.json(summary);
}
