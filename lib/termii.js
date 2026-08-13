/**
 * Termii SMS OTP integration - lib/trustScore.js decides WHETHER a lead
 * needs this step at all (only New/unproven affiliates trigger it); this
 * file only handles the actual send/verify mechanics once that decision
 * has already been made.
 *
 * Docs: https://developers.termii.com/send-token, /verify-token
 * Base URL is Termii's standard Nigeria endpoint - this is a stable,
 * long-standing convention for their API, not something that varies per
 * account.
 */

const TERMII_BASE_URL = "https://api.ng.termii.com/api";
const PIN_LENGTH = 6;
const PIN_TIME_TO_LIVE_MINUTES = 10;
const PIN_ATTEMPTS = 3;

function requireApiKey() {
  const apiKey = process.env.TERMII_API_KEY;
  if (!apiKey) throw new Error("TERMII_API_KEY is not set");
  return apiKey;
}

/**
 * Converts a Nigerian number from the local format used throughout the
 * dashboard/forms (11 digits, starts with 0 - e.g. "08065747045") into the
 * international format Termii actually requires (234 prefix, no leading
 * 0 - e.g. "2348065747045"). This was silently dropped during a later
 * rewrite of this file and is why Termii started rejecting numbers with
 * "Recipient phone number is not a valid, dialable number" - the raw
 * local-format number was being sent as-is.
 */
function toInternationalNigerianNumber(rawNumber) {
  const digitsOnly = (rawNumber || "").replace(/[^\d]/g, "");
  if (digitsOnly.startsWith("234")) return digitsOnly; // already international
  if (digitsOnly.startsWith("0")) return `234${digitsOnly.slice(1)}`; // strip leading 0, prepend 234
  return `234${digitsOnly}`; // no leading 0 present - prepend 234 as-is
}

/**
 * Sends a 6-digit numeric OTP to a Nigerian phone number via SMS.
 * @param {string} phoneNumber - LOCAL format, 11 digits, leading 0 (e.g.
 *   "08065747045") - matches the format every field across this app
 *   already collects and validates. Converted to international format
 *   internally before being sent to Termii.
 * @param {string} businessName - the business the customer is actually dealing with. The
 *   customer submitted a form for THIS business's product, not for Commission - Commission
 *   is invisible infrastructure here, same as everywhere else in the customer-facing flow.
 *   A code from an unfamiliar sender name is exactly the kind of thing a real customer would
 *   distrust or ignore.
 * @returns {Promise<{pinId: string, to: string}>}
 */
export async function sendOtp(phoneNumber, businessName) {
  const apiKey = requireApiKey();
  const senderId = process.env.TERMII_SENDER_ID || "Commission";
  const displayName = businessName || "Commission";

  const res = await fetch(`${TERMII_BASE_URL}/sms/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      message_type: "NUMERIC",
      to: toInternationalNigerianNumber(phoneNumber),
      from: senderId,
      // Termii's own documentation is explicit that the generic route is
      // for promotional messages only - using it for OTPs risks delivery
      // failures or the sender ID getting blocked. This is a real OTP, so
      // it goes through the dnd (transactional) route instead.
      channel: "dnd",
      pin_attempts: PIN_ATTEMPTS,
      pin_time_to_live: PIN_TIME_TO_LIVE_MINUTES,
      pin_length: PIN_LENGTH,
      pin_placeholder: "< 123456 >",
      message_text: `Please confirm your interest in ${displayName} with this code: < 123456 >. Expires in 10 minutes.`,
      pin_type: "NUMERIC",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.pinId) {
    // Guessing at field names already went wrong once (grabbed a boolean
    // flag field instead of an actual message) - always show the full raw
    // response instead of picking one field and hoping it's the right one.
    console.error("Termii sendOtp failed:", res.status, JSON.stringify(data));
    throw new Error(`Termii responded with ${res.status}: ${JSON.stringify(data)}`);
  }
  return { pinId: data.pinId, to: data.to };
}

/**
 * Verifies a code the customer entered against the pinId returned by
 * sendOtp. Returns true only on an exact, unexpired match - any other
 * response (wrong code, expired, too many attempts) returns false rather
 * than throwing, since a wrong code is an expected, normal outcome here,
 * not a system error.
 * @param {string} pinId
 * @param {string} pin
 * @returns {Promise<boolean>}
 */
export async function verifyOtp(pinId, pin) {
  const apiKey = requireApiKey();

  const res = await fetch(`${TERMII_BASE_URL}/sms/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, pin_id: pinId, pin }),
  });

  const data = await res.json();
  // Termii returns verified as either a boolean or the string "True" -
  // normalize defensively rather than trust one exact shape.
  return data.verified === true || data.verified === "True";
}