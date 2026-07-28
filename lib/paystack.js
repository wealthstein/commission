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

/**
 * Create a Paystack subaccount for a business, used to route sale proceeds
 * directly to the business at charge time via a split (see
 * initializeTransaction's `subaccount` param below). This implements the
 * "business receives the product-sale proceeds according to the configured
 * settlement model" step in the TRD (section 5, step 9) instead of Commission
 * ever holding the full sale amount and manually forwarding it.
 */
export async function createBusinessSubaccount({ businessName, bankCode, accountNumber, percentageChargeToBusiness }) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/subaccount`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      business_name: businessName,
      settlement_bank: bankCode,
      account_number: accountNumber,
      // Paystack's percentage_charge is what the SUBACCOUNT is charged, i.e.
      // what Commission's main account keeps at the point of sale. We keep
      // this at (or near) 0 here because Commission's actual revenue comes
      // from the affiliate commission split calculated after the fact, not
      // from a cut of the underlying sale — see the commission engine.
      percentage_charge: percentageChargeToBusiness ?? 0,
    }),
  });
  if (!res.ok) throw new Error(`Paystack subaccount creation failed: ${res.status}`);
  const json = await res.json();
  return json.data; // { subaccount_code, ... }
}

/** List Nigerian banks (for the "connect bank account" UI's dropdown). */
export async function listBanks() {
  const res = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria&currency=NGN`, {
    headers: authHeaders(),
    cache: "force-cache",
  });
  if (!res.ok) throw new Error(`Paystack bank list failed: ${res.status}`);
  const json = await res.json();
  return json.data; // [{ name, code, ... }]
}

/** Resolve/verify an account number + bank code resolves to a real account name. */
export async function resolveAccountNumber({ accountNumber, bankCode }) {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    { headers: authHeaders(), cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Paystack account resolution failed: ${res.status}`);
  const json = await res.json();
  return json.data; // { account_number, account_name, bank_id }
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

/**
 * Initialize a checkout for a product purchase, tagging the referral code
 * in metadata. If the business has a Paystack subaccount on file, the sale
 * proceeds are routed there automatically at settlement (TRD section 5,
 * step 9) — Commission's own account is never a pass-through for the
 * full sale amount.
 */
export async function initializeTransaction({ email, amountNaira, referenceSuffix, metadata, subaccountCode }) {
  const body = {
    email,
    amount: Math.round(amountNaira * 100), // kobo
    reference: `cmn_${Date.now()}_${referenceSuffix}`,
    metadata,
    callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/complete`,
  };
  if (subaccountCode) {
    body.subaccount = subaccountCode;
    // "bearer_type: subaccount" makes the subaccount absorb the Paystack
    // transaction fee, keeping Commission's split resolution simple. Adjust
    // per your commercial agreement with businesses.
    body.bearer_type = "subaccount";
  }

  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Paystack init failed: ${res.status}`);
  const json = await res.json();
  return json.data; // { authorization_url, reference, ... }
}
