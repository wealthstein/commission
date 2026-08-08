/**
 * Builds the unique WhatsApp link a lead gets right after submitting the
 * Interest Form. The lead's whatsapp_ref is embedded in the prefilled message
 * so the business can immediately tell, inside WhatsApp, which lead this
 * conversation belongs to — without needing any separate lookup.
 */
export function buildLeadWhatsAppLink({ whatsappNumber, whatsappRef, productName, leadName }) {
  const digitsOnly = (whatsappNumber || "").replace(/[^\d]/g, "");
  const message = `Hi, I am ${leadName} and I am interested in ${productName}. (Ref: ${whatsappRef})`;
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

/** Generates a short, human-typeable reference code for a new lead. */
export function generateWhatsAppRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
  let ref = "LD-";
  for (let i = 0; i < 6; i++) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return ref;
}
