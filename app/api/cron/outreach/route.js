import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { sendColdOutreachEmail } from "@/lib/email";

const DAYS_BETWEEN_STEPS = 3;
const TOTAL_STEPS = 5;

/**
 * GET/POST /api/cron/outreach
 *
 * LEGACY as of the scheduled-email rewrite in
 * app/api/admin/outreach-contacts - new contacts added through that route
 * have all 5 emails scheduled with Resend upfront (day 0/3/6/9/12), and
 * never touch this cron at all. This route still runs and still matters,
 * but only for contacts added before that rewrite, who are still partway
 * through this older step-by-step mechanism. Once those finish their
 * sequence, this route (and its external scheduler) can be retired.
 *
 * Intended to run daily (see vercel.json). For every contact with
 * status='active': if they've never been emailed, send step 1 immediately;
 * otherwise send the next step once DAYS_BETWEEN_STEPS have passed since
 * the last send. Once step 5 sends, status flips to 'completed' - no more
 * emails go out to them after that.
 *
 * A contact stops getting emails the moment status is anything other than
 * 'active' - which is exactly what the reply-detection webhook sets when a
 * business replies (see app/api/webhooks/resend-inbound).
 */
export async function GET(req) {
  return runOutreachBatch(req);
}
export async function POST(req) {
  return runOutreachBatch(req);
}

async function runOutreachBatch(req) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const summary = { sent: 0, completed: 0, skippedNotDue: 0, errors: [] };

  const { data: contacts, error } = await supabase.from("growth_cold_outreach_contacts").select("*").eq("status", "active");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();

  for (const contact of contacts || []) {
    const due =
      contact.sequence_step === 0 ||
      (contact.last_sent_at && now - new Date(contact.last_sent_at).getTime() >= DAYS_BETWEEN_STEPS * 24 * 60 * 60 * 1000);

    if (!due) {
      summary.skippedNotDue += 1;
      continue;
    }

    const nextStep = contact.sequence_step + 1;

    try {
      await sendColdOutreachEmail(nextStep, {
        to: contact.email_address,
        firstName: contact.first_name || "there",
        audience: contact.audience,
      });

      const isLastStep = nextStep >= TOTAL_STEPS;
      await supabase
        .from("growth_cold_outreach_contacts")
        .update({
          sequence_step: nextStep,
          last_sent_at: new Date().toISOString(),
          status: isLastStep ? "completed" : "active",
        })
        .eq("id", contact.id);

      summary.sent += 1;
      if (isLastStep) summary.completed += 1;
    } catch (err) {
      summary.errors.push({ email: contact.email_address, message: err.message });
    }
  }

  return NextResponse.json(summary);
}
