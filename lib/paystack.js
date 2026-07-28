import crypto from "crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

/**
 * Verify a webhook request actually came from Paystack.
 * Paystack signs the raw request body with your secret key (HMAC SHA512)
 * and sends it in the `x-paystack-signature` header.
 */
export function verifyPaystackSignature(rawBody, signatureHeader) {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");
  return hash === signatureHeader;
}

/** Confirm a transaction's status directly with Paystack (defense in depth vs. spoofed webhooks). */
export async function verifyTransaction(reference) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Paystack verify failed: ${res.status}`);
  const json = await res.json();
  return json.data; // { status: 'success', amount, customer, ... }
}

/** Create a Paystack transfer recipient for an affiliate's bank account. */
export async function createTransferRecipient({ name, accountNumber, bankCode }) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      type: "nuban",
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    }),
  });
  if (!res.ok) throw new Error(`Paystack recipient creation failed: ${res.status}`);
  const json = await res.json();
  return json.data; // { recipient_code, ... }
}

/** Initiate a payout transfer to an affiliate. amountNaira is converted to kobo. */
export async function initiateTransfer({ amountNaira, recipientCode, reason }) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      source: "balance",
      amount: Math.round(amountNaira * 100), // kobo
      recipient: recipientCode,
      reason: reason || "Commission affiliate payout",
    }),
  });
  if (!res.ok) throw new Error(`Paystack transfer failed: ${res.status}`);
  const json = await res.json();
  return json.data; // { transfer_code, status, ... }
}

/** Initialize a checkout for a product purchase, tagging the referral code in metadata. */
export async function initializeTransaction({ email, amountNaira, referenceSuffix, metadata }) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email,
      amount: Math.round(amountNaira * 100), // kobo
      reference: `cmn_${Date.now()}_${referenceSuffix}`,
      metadata,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/complete`,
    }),
  });
  if (!res.ok) throw new Error(`Paystack init failed: ${res.status}`);
  const json = await res.json();
  return json.data; // { authorization_url, reference, ... }
}
