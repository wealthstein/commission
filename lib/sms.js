/**
 * Provider-agnostic OTP sending - every caller in this app imports from
 * here, never directly from lib/termii.js or lib/sendchamp.js. Switching
 * providers is a one-line env var change (SMS_PROVIDER=termii or
 * sendchamp), not a code change, since both providers export the exact
 * same sendOtp/verifyOtp signature.
 *
 * Default is Sendchamp - Termii's account is currently stuck on "Country
 * Inactive" with no clear timeline, while Sendchamp's sender IDs already
 * show Approved. Flip SMS_PROVIDER back to "termii" the moment Termii's
 * account clears, with no other code changes needed anywhere.
 */
import * as termii from "@/lib/termii";
import * as sendchamp from "@/lib/sendchamp";

function activeProvider() {
  const provider = process.env.SMS_PROVIDER || "sendchamp";
  if (provider === "termii") return termii;
  if (provider === "sendchamp") return sendchamp;
  throw new Error(`Unknown SMS_PROVIDER: "${provider}" - expected "termii" or "sendchamp"`);
}

export async function sendOtp(phoneNumber, businessName) {
  return activeProvider().sendOtp(phoneNumber, businessName);
}

export async function verifyOtp(pinId, pin) {
  return activeProvider().verifyOtp(pinId, pin);
}
