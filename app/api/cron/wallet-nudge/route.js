import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { sendWalletNudgeEmail } from "@/lib/email";

const DAYS_BETWEEN_STEPS = 3;
const TOTAL_STEPS = 5;
const PAUSE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * GET/POST /api/cron/wallet-nudge
 * Intended to run daily (cron-job.org, same pattern as the outreach cron).
 *
 * Cadence per business: day 0, 3, 6, 9, 12 (5 emails, cycle 1). If still
 * unfunded after email 5, pause 14 days, then repeat the same 5-email
 * cadence once more (cycle 2). If still unfunded after cycle 2's email 5,
 * status becomes 'exhausted' - no further emails, ever, unless the row is
 * manually reset.
 *
 * Stops permanently, at any point, the moment a real topup shows up in
 * wallet_transactions - checked fresh on every pass, not just at signup.
 */
export async function GET(req) {
  return runWalletNudgeBatch(req);
}
export async function POST(req) {
  return runWalletNudgeBatch(req);
}

async function runWalletNudgeBatch(req) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const summary = { newlyEnrolled: 0, sent: 0, paused: 0, resumed: 0, exhausted: 0, markedToppedUp: 0, skippedNotDue: 0, errors: [] };
  const now = Date.now();

  // 1. Enroll any business that has never funded and has no nudge row yet.
  const { data: businesses } = await supabase.from("core_businesses").select("id, name, owner_id");
  const { data: existingNudges } = await supabase.from("billing_wallet_funding_nudges").select("business_id");
  const existingIds = new Set((existingNudges || []).map((n) => n.business_id));

  for (const business of businesses || []) {
    if (existingIds.has(business.id)) continue;

    const { data: topups } = await supabase
      .from("billing_wallet_transactions")
      .select("id")
      .eq("business_id", business.id)
      .eq("type", "topup")
      .limit(1);

    if (topups && topups.length > 0) continue; // already funded before this sequence existed - nothing to nudge

    const { error: insertError } = await supabase
      .from("billing_wallet_funding_nudges")
      .insert({ business_id: business.id, cycle: 1, sequence_step: 0, status: "active" });
    if (!insertError) summary.newlyEnrolled += 1;
  }

  // 2. Process every active nudge.
  const { data: activeNudges } = await supabase.from("billing_wallet_funding_nudges").select("*").eq("status", "active");

  for (const nudge of activeNudges || []) {
    try {
      // Always check for a real topup first - stops the sequence dead the
      // moment it's no longer needed, regardless of where in the cycle it is.
      const { data: topups } = await supabase
        .from("billing_wallet_transactions")
        .select("id")
        .eq("business_id", nudge.business_id)
        .eq("type", "topup")
        .limit(1);

      if (topups && topups.length > 0) {
        await supabase.from("billing_wallet_funding_nudges").update({ status: "topped_up" }).eq("id", nudge.id);
        summary.markedToppedUp += 1;
        continue;
      }

      // Still in the 14-day pause window - do nothing yet.
      if (nudge.paused_until && now < new Date(nudge.paused_until).getTime()) {
        summary.skippedNotDue += 1;
        continue;
      }

      // Pause window just ended - start cycle 2 fresh.
      if (nudge.paused_until && now >= new Date(nudge.paused_until).getTime()) {
        const { data: business } = await supabase.from("core_businesses").select("id, name, owner_id").eq("id", nudge.business_id).single();
        const { data: ownerRow } = await supabase.from("core_users").select("email, full_name").eq("id", business.owner_id).single();

        await sendWalletNudgeEmail(1, {
          to: ownerRow.email,
          businessName: business.name || ownerRow.full_name,
          walletUrl: `${req.nextUrl.origin}/dashboard/account`,
        });

        await supabase
          .from("billing_wallet_funding_nudges")
          .update({ cycle: 2, sequence_step: 1, last_sent_at: new Date().toISOString(), paused_until: null })
          .eq("id", nudge.id);

        summary.resumed += 1;
        summary.sent += 1;
        continue;
      }

      // Normal within-cycle cadence.
      const due =
        nudge.sequence_step === 0 ||
        (nudge.last_sent_at && now - new Date(nudge.last_sent_at).getTime() >= DAYS_BETWEEN_STEPS * DAY_MS);

      if (!due) {
        summary.skippedNotDue += 1;
        continue;
      }

      const nextStep = nudge.sequence_step + 1;
      const { data: business } = await supabase.from("core_businesses").select("id, name, owner_id").eq("id", nudge.business_id).single();
      const { data: ownerRow } = await supabase.from("core_users").select("email, full_name").eq("id", business.owner_id).single();

      await sendWalletNudgeEmail(nextStep, {
        to: ownerRow.email,
        businessName: business.name || ownerRow.full_name,
        walletUrl: `${req.nextUrl.origin}/dashboard/account`,
      });
      summary.sent += 1;

      const isLastStepOfCycle = nextStep >= TOTAL_STEPS;

      if (!isLastStepOfCycle) {
        await supabase
          .from("billing_wallet_funding_nudges")
          .update({ sequence_step: nextStep, last_sent_at: new Date().toISOString() })
          .eq("id", nudge.id);
      } else if (nudge.cycle === 1) {
        // End of cycle 1 - pause 14 days before cycle 2.
        await supabase
          .from("billing_wallet_funding_nudges")
          .update({
            sequence_step: nextStep,
            last_sent_at: new Date().toISOString(),
            paused_until: new Date(now + PAUSE_DAYS * DAY_MS).toISOString(),
          })
          .eq("id", nudge.id);
        summary.paused += 1;
      } else {
        // End of cycle 2 - done trying.
        await supabase
          .from("billing_wallet_funding_nudges")
          .update({ sequence_step: nextStep, last_sent_at: new Date().toISOString(), status: "exhausted" })
          .eq("id", nudge.id);
        summary.exhausted += 1;
      }
    } catch (err) {
      summary.errors.push({ nudgeId: nudge.id, message: err.message });
    }
  }

  return NextResponse.json(summary);
}
