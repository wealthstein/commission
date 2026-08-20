/**
 * Sendchamp SMS OTP integration - a drop-in alternative to termii.js,
 * same sendOtp/verifyOtp interface, selected via lib/sms.js based on
 * SMS_PROVIDER. Exists because Termii's account is stuck on "Country
 * Inactive" with no clear timeline; Sendchamp's sender IDs (including
 * SC-OTP) show Approved with no pending state.
 *
 * Docs confirmed via developers.sendchamp.com and sendchamp.readme.io:
 *   POST /api/v1/verification/create -> { channel, sender, token_length,
 *     token_type, expiration_time, ...} returns { data: { verification_reference } }
 *   POST /api/v1/verification/confirm -> { verification_reference, verification_otp }
 *     (field name confirmed directly against Sendchamp's own tutorial at
 *     developers.sendchamp.com - this was previously "verification_code",
 *     a real bug now fixed on that basis, not a guess)
 *
 * ONE FIELD WAS PARTIALLY VERIFIED, updated based on real evidence: the
 * exact key name for the recipient's phone number. Sendchamp's own "Test
 * SMS" tool in their dashboard uses "phone_number" for their plain SMS
 * send endpoint (/sms/send) - this is a DIFFERENT endpoint than the one
 * this file calls (/verification/create), so it's not a guaranteed exact
 * match, but it's real evidence of Sendchamp's naming convention rather
 * than a cold guess. Updated from an earlier guess of
 * "customer_mobile_number" to "phone_number" on that basis. If sending
 * still fails with a phone-related validation error, this is still the
 * first thing to check.
 */

const SENDCHAMP_BASE_URL = "https://api.sendchamp.com/api/v1";
const TOKEN_LENGTH = 6;
const EXPIRATION_MINUTES = 10;

function requireApiKey() {
  const apiKey = process.env.SENDCHAMP_API_KEY;
  if (!apiKey) throw new Error("SENDCHAMP_API_KEY is not set");
  return apiKey;
}

/**
 * Same conversion as termii.js's toInternationalNigerianNumber - every
 * phone field across this app collects the local 11-digit format, and
 * Sendchamp (like Termii) requires the international format with no
 * leading 0.
 */
function toInternationalNigerianNumber(rawNumber) {
  const digitsOnly = (rawNumber || "").replace(/[^\d]/g, "");
  if (digitsOnly.startsWith("234")) return digitsOnly;
  if (digitsOnly.startsWith("0")) return `234${digitsOnly.slice(1)}`;
  return `234${digitsOnly}`;
}

/**
 * @param {string} phoneNumber - LOCAL format, 11 digits, leading 0.
 * @param {string} businessName - unused for Sendchamp's OTP channel - their
 *   verification API sends a fixed-format code message, not a custom body,
 *   so there is nowhere to put the business name the way Termii's
 *   message_text allowed. Kept as a parameter only so this function has
 *   the exact same signature as termii.js's sendOtp for a clean swap.
 * @returns {Promise<{pinId: string, to: string}>} - "pinId" is Sendchamp's
 *   verification_reference, named pinId here (not renamed to something
 *   Sendchamp-specific) so every caller and the database columns storing
 *   it can stay provider-agnostic.
 */
export async function sendOtp(phoneNumber, businessName) {
  const apiKey = requireApiKey();
  const senderId = process.env.SENDCHAMP_SENDER_ID || "SC-OTP";
  const to = toInternationalNigerianNumber(phoneNumber);

  const res = await fetch(`${SENDCHAMP_BASE_URL}/verification/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      channel: "sms",
      sender: senderId,
      token_type: "numeric",
      token_length: TOKEN_LENGTH,
      expiration_time: EXPIRATION_MINUTES,
      // See the file-level comment - "phone_number" is based on real
      // evidence from Sendchamp's own Test SMS tool, not a cold guess,
      // though confirmed on a different endpoint than this one.
      phone_number: to,
    }),
  });

  const data = await res.json();
  const reference = data?.data?.verification_reference;
  if (!res.ok || !reference) {
    console.error("Sendchamp sendOtp failed:", res.status, JSON.stringify(data));
    throw new Error(`Sendchamp responded with ${res.status}: ${JSON.stringify(data)}`);
  }
  return { pinId: reference, to };
}

/**
 * @param {string} pinId - the verification_reference returned by sendOtp.
 * @param {string} pin
 * @returns {Promise<boolean>}
 */
export async function verifyOtp(pinId, pin) {
  const apiKey = requireApiKey();

  const res = await fetch(`${SENDCHAMP_BASE_URL}/verification/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ verification_reference: pinId, verification_otp: pin }),
  });

  if (!res.ok) return false;
  const data = await res.json();
  // Mirrors termii.js's defensive normalization - don't trust one exact
  // shape for a success signal.
  return data?.status === "success" || data?.data?.status === "verified" || data?.data?.status === "success";
}