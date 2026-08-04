import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";

/**
 * POST /api/webhooks/brevo-inbound
 *
 * SETUP REQUIRED before this does anything (none of this is code, all of
 * it is Brevo dashboard + DNS configuration):
 *   1. Brevo requires a SEPARATE receiving subdomain, distinct from your
 *      sending domain - e.g. reply.commission.ng, not commission.ng itself.
 *   2. Delegate that subdomain's DNS to Brevo (they give you the exact
 *      records to add wherever commission.ng's DNS is managed).
 *   3. Brevo dashboard -> Integrations -> Webhooks -> Inbound webhook ->
 *      point it at this route's full URL.
 *   4. Send a real test reply to that subdomain, then use Brevo's own
 *      "reload / preview last 10 payloads" tool to see the ACTUAL field
 *      names - Brevo's docs describe the payload as an items[] array but
 *      do not fully spell out every field name. Adjust extractSenderEmail
 *      below once you can see a real payload; this is a best-effort
 *      extraction, not a confirmed contract.
 *
 * Until all four steps above are done, nothing calls this route at all -
 * replies just land in a normal inbox, invisible to the cron.
 */

function extractSenderEmail(item) {
  // Defensive - tries the field names Brevo's own docs and community
  // examples reference, in order of likelihood. Replace with the exact
  // field once you've seen a real payload via Brevo's preview tool.
  const candidate =
    item?.From ||
    item?.from ||
    item?.Sender ||
    item?.sender ||
    item?.Headers?.from ||
    item?.headers?.from;

  if (!candidate) return null;
  // Handles both a plain "email@x.com" string and a "Name <email@x.com>" format.
  const match = String(candidate).match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return match ? match[0].toLowerCase() : null;
}

export async function POST(req) {
  const body = await req.json();
  const items = Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : [body];

  const supabase = createAdminSupabaseClient();
  const results = [];

  for (const item of items) {
    const senderEmail = extractSenderEmail(item);
    if (!senderEmail) continue;

    const { data, error } = await supabase
      .from("cold_outreach_contacts")
      .update({ status: "replied" })
      .eq("email", senderEmail)
      .eq("status", "active")
      .select();

    if (!error && data?.length > 0) {
      results.push(senderEmail);
    }
  }

  return NextResponse.json({ markedReplied: results });
}
