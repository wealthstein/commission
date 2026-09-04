import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { sendColdOutreachEmail } from "@/lib/email";

const DAYS_BETWEEN_STEPS = 3;

function daysFromNowIso(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * POST /api/admin/outreach-contacts
 * body: { secret, contacts: [{ firstName, lastName, email, contactType }] }
 *
 * Replaces the manual "Supabase Table Editor -> CSV import" workflow
 * described in schema.sql's own comment.
 *
 * All 5 emails are scheduled with Resend the moment a contact is added -
 * email 1 sends immediately, emails 2-5 are scheduled for day 3/6/9/12
 * using Resend's own scheduled_at parameter (verified: Resend holds and
 * fires these automatically, up to 30 days ahead - see
 * https://resend.com/docs/api-reference/emails/send-email). This
 * eliminates the daily-cron dependency entirely for any contact added
 * through this route - no external scheduler needed, no manual triggering.
 *
 * app/api/cron/outreach still exists and still runs, but only matters now
 * for contacts added before this rewrite, who are still partway through
 * the old step-by-step mechanism. Nothing new goes through it.
 *
 * Reply detection (app/api/webhooks/resend-inbound) uses the stored
 * email_N_resend_id columns to actually cancel the remaining scheduled
 * emails via Resend's cancel endpoint, not just flip a status flag.
 *
 * Protected by a shared secret rather than real admin auth, since no
 * admin auth system exists in this app yet.
 */
export async function POST(req) {
  const { secret, contacts } = await req.json();

  if (!process.env.ADMIN_OUTREACH_SECRET || secret !== process.env.ADMIN_OUTREACH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ error: "contacts must be a non-empty array" }, { status: 400 });
  }

  const rows = contacts
    .filter((c) => c.email)
    .map((c) => ({
      email_address: c.email.trim().toLowerCase(),
      first_name: c.firstName?.trim() || null,
      last_name: c.lastName?.trim() || null,
      contact_type: c.contactType?.trim() || null,
    }));

  const supabase = createAdminSupabaseClient();

  // Phase 1: insert - upsert with ignoreDuplicates rather than a hard
  // insert, since email_address is unique and an admin pasting leads in
  // small batches over time is likely to accidentally overlap with a
  // previous batch. Only rows returned here are genuinely new - already-
  // existing contacts are silently skipped and never re-scheduled.
  const { data: insertedRows, error: insertError } = await supabase
    .from("growth_cold_outreach_contacts")
    .upsert(rows, { onConflict: "email_address", ignoreDuplicates: true })
    .select();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Phase 2: schedule all 5 emails for each genuinely new contact. Each
  // contact is handled independently - one failing doesn't stop the rest,
  // since a partial batch succeeding is much better than the whole
  // submission silently doing nothing.
  const schedulingErrors = [];

  for (const row of insertedRows) {
    try {
      await sendColdOutreachEmail(1, { to: row.email_address, firstName: row.first_name || "there" });

      const email2 = await sendColdOutreachEmail(2, {
        to: row.email_address,
        firstName: row.first_name || "there",
        scheduledAt: daysFromNowIso(DAYS_BETWEEN_STEPS),
      });
      const email3 = await sendColdOutreachEmail(3, {
        to: row.email_address,
        firstName: row.first_name || "there",
        scheduledAt: daysFromNowIso(DAYS_BETWEEN_STEPS * 2),
      });
      const email4 = await sendColdOutreachEmail(4, {
        to: row.email_address,
        firstName: row.first_name || "there",
        scheduledAt: daysFromNowIso(DAYS_BETWEEN_STEPS * 3),
      });
      const email5 = await sendColdOutreachEmail(5, {
        to: row.email_address,
        firstName: row.first_name || "there",
        scheduledAt: daysFromNowIso(DAYS_BETWEEN_STEPS * 4),
      });

      await supabase
        .from("growth_cold_outreach_contacts")
        .update({
          sequence_step: 1,
          last_sent_at: new Date().toISOString(),
          email_2_resend_id: email2?.id || null,
          email_3_resend_id: email3?.id || null,
          email_4_resend_id: email4?.id || null,
          email_5_resend_id: email5?.id || null,
        })
        .eq("id", row.id);
    } catch (err) {
      schedulingErrors.push({ email: row.email_address, message: err.message });
    }
  }

  return NextResponse.json({
    inserted: insertedRows.length,
    submitted: rows.length,
    skippedDuplicates: rows.length - insertedRows.length,
    schedulingErrors,
  });
}
