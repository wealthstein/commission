import { generateLeadRef } from "@/lib/leadRef";
import { SITE_URL } from "@/lib/seo";

/**
 * Creates the actual leads row and returns the direct link to the Intent
 * Form. Used from two places that must behave identically: the
 * trusted-affiliate path (app/api/leads/capture) where this happens
 * immediately, and the post-OTP-verification path
 * (app/api/leads/verify-otp) where it happens only after the code is
 * confirmed. Keeping this in one place means those two paths can never
 * quietly drift apart from each other.
 *
 * WhatsApp is no longer part of this flow at all - a prospect goes
 * straight from the Interest Form (with an inline OTP step for unproven
 * affiliates) to the Intent Form, no handoff link, no redirect through a
 * third-party app.
 *
 * Deliberately does not store fullName/phone/email on the leads row - see
 * the schema comment on the leads table itself for why.
 */
export async function createLeadAndGetIntentFormUrl(supabase, { programId, enrollmentId, clickId, program }) {
  const leadRef = generateLeadRef();

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      program_id: programId,
      click_id: clickId,
      enrollment_id: enrollmentId,
      lead_ref: leadRef,
      status: "captured",
      forwarded_to: "none",
    })
    .select()
    .single();
  if (error) throw error;

  const intentFormUrl = `${SITE_URL}/leads/${leadRef}/continue`;

  return { leadId: lead.id, leadRef, intentFormUrl };
}
