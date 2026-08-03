import { sendLeadDetailsEmail } from "@/lib/email";

/**
 * Forwards a qualified lead's full details (name/phone/email/notes) to the
 * business that owns the campaign, then the caller discards them —
 * Commission never writes this payload to its own database (see the leads
 * table in supabase/schema.sql). "Business db or CRM or email" — whichever
 * the business has configured, falling back to their account email if
 * neither lead_notification_email nor lead_webhook_url is set.
 *
 * `customFieldAnswers` (an array of { label, value }, from the business's
 * own campaign_custom_fields questions) gets the identical treatment - only
 * the QUESTIONS are stored (campaign_custom_fields), never the ANSWERS.
 *
 * @returns {Promise<'email'|'webhook'|'both'|'none'>} what actually succeeded, for the leads.forwarded_to audit column
 */
export async function forwardLeadToBusiness(supabase, { business, ownerEmail, productName, fullName, phone, email, details, customFieldAnswers }) {
  let webhookOk = false;
  let emailOk = false;

  if (business.lead_webhook_url) {
    try {
      const res = await fetch(business.lead_webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "lead.qualified",
          product: productName,
          fullName,
          phone,
          email: email ?? null,
          details: details ?? null,
          customFieldAnswers: customFieldAnswers ?? [],
        }),
      });
      webhookOk = res.ok;
    } catch (err) {
      console.error(`Lead webhook forward failed for business ${business.id}:`, err.message);
    }
  }

  const destinationEmail = business.lead_notification_email || ownerEmail;
  if (destinationEmail) {
    const result = await sendLeadDetailsEmail({
      to: destinationEmail,
      businessName: business.name,
      productName,
      fullName,
      phone,
      email,
      details,
      customFieldAnswers,
    });
    emailOk = !result?.skipped;
  }

  if (webhookOk && emailOk) return "both";
  if (webhookOk) return "webhook";
  if (emailOk) return "email";
  return "none";
}
