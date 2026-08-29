import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { cancelScheduledEmail } from "@/lib/email";

/**
 * POST /api/webhooks/resend-inbound
 *
 * SETUP REQUIRED before this does anything (none of this is code, all of
 * it is Resend dashboard + DNS configuration):
 *   1. reply.commission.ng needs an MX record pointed at Resend - this is
 *      SEPARATE from the sending-domain verification (SPF/DKIM/DMARC).
 *      "Verified for sending" does not mean "configured for receiving."
 *      Resend's docs strongly recommend verifying inbound on a subdomain
 *      like this, not the root domain, to avoid conflicting with existing
 *      MX records commission.ng may already have.
 *   2. Resend dashboard -> Webhooks -> Add Webhook -> select the
 *      email.received event -> point it at this route's full URL.
 *   3. Copy the webhook's signing secret from the dashboard into
 *      RESEND_WEBHOOK_SECRET.
 *   4. Send a real test reply to a @reply.commission.ng address, then
 *      check this route's logs (or Resend's own webhook delivery log) to
 *      see the ACTUAL payload shape - the sender-email extraction below
 *      is a best-effort guess at the field path based on Resend's public
 *      docs, which describe email.received as containing "sender,
 *      recipient, subject" but do not spell out the exact JSON key names.
 *      Adjust extractSenderEmail once a real payload is visible.
 *
 * Until all four steps above are done, nothing calls this route at all -
 * replies just land wherever reply.commission.ng's mail currently goes,
 * invisible to the cron.
 *
 * Deliberately does NOT fetch the full email body via
 * resend.emails.receiving.get() - detecting that a reply happened at all
 * is enough to cancel the remaining scheduled emails; reading the reply's
 * content isn't needed for that.
 *
 * Actually cancels the remaining scheduled emails via Resend's cancel
 * endpoint (see lib/email.js's cancelScheduledEmail), using the
 * email_N_resend_id values stored when the sequence was scheduled - not
 * just a status flag for a cron to notice later, since there's no longer
 * a cron in the loop for contacts added through the scheduled-email flow.
 */

const resend = new Resend(process.env.RESEND_API_KEY);

function extractSenderEmail(eventData) {
  // Defensive - tries the field shapes most inbound-email APIs use, in
  // order of likelihood, since Resend's own docs describe the payload's
  // content without giving the exact key names. Handles both a plain
  // string and a {address, name} object shape for the "from" field.
  const candidate =
    eventData?.from?.address ||
    eventData?.from ||
    eventData?.sender?.address ||
    eventData?.sender ||
    eventData?.envelope?.from;

  if (!candidate) return null;
  const match = String(candidate).match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return match ? match[0].toLowerCase() : null;
}

export async function POST(req) {
  const payload = await req.text();

  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        "svix-id": req.headers.get("svix-id"),
        "svix-timestamp": req.headers.get("svix-timestamp"),
        "svix-signature": req.headers.get("svix-signature"),
      },
      secret: process.env.RESEND_WEBHOOK_SECRET,
    });
  } catch (err) {
    console.error("Resend webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event.type !== "email.received") {
    return NextResponse.json({ ignored: event.type });
  }

  const senderEmail = extractSenderEmail(event.data);
  if (!senderEmail) {
    console.error("Could not extract sender email from Resend payload:", JSON.stringify(event.data));
    return NextResponse.json({ error: "Could not extract sender email" }, { status: 200 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: contact } = await supabase
    .from("cold_outreach_contacts")
    .select("id, email_2_resend_id, email_3_resend_id, email_4_resend_id, email_5_resend_id")
    .eq("email_address", senderEmail)
    .eq("status", "active")
    .maybeSingle();

  if (!contact) {
    // Not an active outreach contact - could be a reply on a contact
    // that's already completed/replied before, or an email to
    // reply.commission.ng unrelated to this sequence entirely.
    return NextResponse.json({ markedReplied: null });
  }

  // Cancel whichever of the 4 scheduled emails haven't gone out yet. Any
  // of these could already be null (a contact added before this
  // scheduled-email rewrite, still on the legacy step-by-step cron) or
  // already sent (Resend's cancel endpoint just no-ops safely on those -
  // see lib/email.js's cancelScheduledEmail).
  await Promise.all(
    [contact.email_2_resend_id, contact.email_3_resend_id, contact.email_4_resend_id, contact.email_5_resend_id]
      .filter(Boolean)
      .map((id) => cancelScheduledEmail(id))
  );

  const { error } = await supabase.from("cold_outreach_contacts").update({ status: "replied" }).eq("id", contact.id);

  if (error) {
    console.error("Failed to mark contact as replied:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ markedReplied: senderEmail });
}