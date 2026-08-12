import { buildLeadWhatsAppLink, generateWhatsAppRef } from "@/lib/whatsapp";

/**
 * Creates the actual leads row and builds the WhatsApp handoff link. Used
 * from two places that must behave identically: the trusted-affiliate
 * path (app/api/leads/capture) where this happens immediately, and the
 * post-OTP-verification path (app/api/leads/verify-otp) where it happens
 * only after the code is confirmed. Keeping this in one place means those
 * two paths can never quietly drift apart from each other.
 *
 * Deliberately does not store fullName/phone/email on the leads row - see
 * the schema comment on the leads table itself for why.
 */
export async function createLeadAndWhatsAppLink(supabase, { programId, enrollmentId, clickId, fullName, program }) {
  const whatsappRef = generateWhatsAppRef();

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      program_id: programId,
      click_id: clickId,
      enrollment_id: enrollmentId,
      whatsapp_ref: whatsappRef,
      status: "captured",
      forwarded_to: "none",
    })
    .select()
    .single();
  if (error) throw error;

  let whatsappNumber = program.whatsapp_number;
  if (!whatsappNumber) {
    const { data: business } = await supabase
      .from("businesses")
      .select("whatsapp_number")
      .eq("id", program.products.business_id)
      .maybeSingle();
    whatsappNumber = business?.whatsapp_number ?? null;
  }
  const whatsappLink = whatsappNumber
    ? buildLeadWhatsAppLink({
        whatsappNumber,
        whatsappRef,
        productName: program.products.name,
        leadName: fullName,
      })
    : null;

  return { leadId: lead.id, whatsappRef, whatsappLink };
}
