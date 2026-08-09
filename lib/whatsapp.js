/**
 * Builds the unique WhatsApp link a lead gets right after submitting the
 * Interest Form. The lead's whatsapp_ref is embedded in the prefilled message
 * so the business can immediately tell, inside WhatsApp, which lead this
 * conversation belongs to — without needing any separate lookup.
 */
export function buildLeadWhatsAppLink({ whatsappNumber, whatsappRef, productName, leadName }) {
  const message = `Hi, I am ${leadName} and I am interested in ${productName}. (Ref: ${whatsappRef})`;
  return `https://wa.me/${toInternationalNigerianNumber(whatsappNumber)}?text=${encodeURIComponent(message)}`;
}

/**
 * Converts a Nigerian number from the local format used throughout the
 * dashboard/forms (11 digits, starts with 0 - e.g. "09028525888") into the
 * international format wa.me links actually require (234 prefix, no
 * leading 0 - e.g. "2349028525888"). Without this conversion, WhatsApp
 * cannot resolve the number to a real chat - it shows the intermediate
 * "Chat on WhatsApp with [number]" screen, then a blank chat window, since
 * the number as typed is not a valid WhatsApp contact identifier.
 */
function toInternationalNigerianNumber(rawNumber) {
  const digitsOnly = (rawNumber || "").replace(/[^\d]/g, "");
  if (digitsOnly.startsWith("234")) return digitsOnly; // already international
  if (digitsOnly.startsWith("0")) return `234${digitsOnly.slice(1)}`; // strip leading 0, prepend 234
  return `234${digitsOnly}`; // no leading 0 present - prepend 234 as-is
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