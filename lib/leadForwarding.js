import { sendLeadDetailsEmail } from "@/lib/email";

// Industries where a physical step (viewing, inspection) is required before
// a deal can close, meaning the affiliate needs to track the transaction
// themselves rather than relying only on the business's word. Real estate
// is the only one enabled for now - deliberately checked by industry, not
// a manually-set toggle, so this can't drift out of sync and so adding a
// second industry later (e.g. Automobile) is a one-line change here.
const PHYSICAL_CLOSING_INDUSTRIES = ["Real Estate"];

export function requiresAffiliateContactSharing(business) {
  return PHYSICAL_CLOSING_INDUSTRIES.includes(business?.industry);
}

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
 * `affiliateEmail`/`affiliateName`, when the business's industry requires
 * a physical closing step (see requiresAffiliateContactSharing above), get
 * the SAME forward-and-discard treatment as the business copy - Commission
 * still never stores this anywhere. The prospect must be told this is
 * happening at Intent Form submission time (see the Intent Form disclosure) -
 * this function does not decide whether disclosure happened, only forwards.
 *
 * @returns {Promise<'email'|'webhook'|'both'|'none'>} what actually succeeded, for the leads.forwarded_to audit column
 */
export async function forwardLeadToBusiness(supabase, { business, ownerEmail, productName, fullName, phone, email, details, customFieldAnswers, affiliateEmail, affiliateName }) {
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

  // Real estate (and any future physical-closing industry) only - the
  // affiliate gets the same details, so they can track their own deal
  // through to close, since Commission has no way to observe a physical
  // viewing or an off-platform payment.
  if (affiliateEmail && requiresAffiliateContactSharing(business)) {
    await sendLeadDetailsEmail({
      to: affiliateEmail,
      businessName: affiliateName ? `${affiliateName} (your referral)` : "there",
      productName,
      fullName,
      phone,
      email,
      details,
      customFieldAnswers,
    });
  }

  if (webhookOk && emailOk) return "both";
  if (webhookOk) return "webhook";
  if (emailOk) return "email";
  return "none";
}
