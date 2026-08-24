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
 * Create a Paystack subaccount for a business — the destination for their
 * share of a 'sale'-goal campaign's checkout payments (see
 * initializeDirectSaleCheckout below). percentage_charge is deliberately 0:
 * the split for each transaction is computed dynamically per-checkout by
 * the commission engine (transaction_charge below), not a fixed percentage
 * on the subaccount itself.
 */
export async function createBusinessSubaccount({ businessName, bankCode, accountNumber }) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/subaccount`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      business_name: businessName,
      settlement_bank: bankCode,
      account_number: accountNumber,
      percentage_charge: 0,
    }),
  });
  if (!res.ok) throw new Error(`Paystack subaccount creation failed: ${res.status}`);
  const json = await res.json();
  return json.data; // { subaccount_code, ... }
}

/**
 * Initialize a checkout for a 'sale'-goal campaign — the ONE place a
 * customer pays Commission directly. Paystack splits this single payment
 * automatically at settlement:
 *   - `subaccount` receives everything EXCEPT transactionChargeNaira — the
 *     business's own proceeds, same as if they had sold it themselves.
 *   - Commission's main account keeps transactionChargeNaira — the total
 *     affiliate commission for this sale, held there until the normal
 *     payout batch job transfers each affiliate their share and Commission
 *     keeps the platform-fee remainder.
 * If there is no referring affiliate (no subaccount split needed at all,
 * or nothing for Commission to hold back), pass transactionChargeNaira: 0.
 */
export async function initializeDirectSaleCheckout({
  email,
  amountNaira,
  campaignId,
  referralCode,
  subaccountCode,
  transactionChargeNaira,
}) {
  const body = {
    email,
    amount: Math.round(amountNaira * 100), // kobo
    reference: `sale_${Date.now()}_${campaignId}`,
    metadata: { purpose: "direct_sale", campaign_id: campaignId, referral_code: referralCode ?? null },
    callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/complete`,
  };
  if (subaccountCode) {
    body.subaccount = subaccountCode;
    body.transaction_charge = Math.round((transactionChargeNaira || 0) * 100); // kobo, kept by the main account
  }

  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Paystack checkout init failed: ${res.status}`);
  const json = await res.json();
  return json.data; // { authorization_url, reference, ... }
}

/**
 * Initialize a Paystack checkout for a BUSINESS topping up their campaign
 * wallet — used by LEAD-goal campaigns only (see initializeDirectSaleCheckout
 * above for the 'sale'-goal equivalent). The webhook handler credits the
 * wallet (via fn_charge_wallet) once this succeeds.
 */
export async function initializeWalletTopup({ email, amountNaira, businessId }) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email,
      amount: Math.round(amountNaira * 100), // kobo
      reference: `wallet_${Date.now()}_${businessId}`,
      metadata: { purpose: "wallet_topup", business_id: businessId },
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/account`,
    }),
  });
  if (!res.ok) throw new Error(`Paystack wallet top-up init failed: ${res.status}`);
  const json = await res.json();
  return json.data; // { authorization_url, reference, ... }
}
