/**
 * Thin wrapper around the fn_charge_wallet() Postgres function (see
 * supabase/schema.sql). All wallet balance changes MUST go through this —
 * never update businesses.wallet_balance_naira directly from app code —
 * because the DB function does row-locking + the insufficient-balance check
 * atomically, which a plain "read balance, then update" from JS cannot do
 * safely under concurrent requests.
 */

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - an admin client (bypasses RLS; this always runs server-side)
 * @param {Object} params
 * @param {string} params.businessId
 * @param {number} params.amountNaira - SIGNED, and already NET of any fee: positive to credit (topup/refund), negative to debit (a charge)
 * @param {'topup'|'qualified_lead_charge'|'sale_charge'|'refund'|'adjustment'} params.type
 * @param {string} [params.leadId]
 * @param {string} [params.transactionId]
 * @param {string} [params.paystackReference]
 * @param {number} [params.grossAmountNaira] - topup only: what the business actually paid via Paystack, before the fee
 * @param {number} [params.platformFeeNaira] - topup only: Commission's cut, kept out of the wallet entirely
 * @returns {Promise<{id: string, balance_after_naira: number, [key: string]: any}>}
 * @throws if the business does not exist, or a debit would take the balance below zero
 */
export async function chargeWallet(
  supabase,
  { businessId, amountNaira, type, leadId, transactionId, paystackReference, grossAmountNaira, platformFeeNaira }
) {
  const { data, error } = await supabase.rpc("fn_charge_wallet", {
    p_business_id: businessId,
    p_amount: amountNaira,
    p_type: type,
    p_lead_id: leadId ?? null,
    p_transaction_id: transactionId ?? null,
    p_paystack_reference: paystackReference ?? null,
    p_gross_amount: grossAmountNaira ?? null,
    p_platform_fee: platformFeeNaira ?? null,
  });
  if (error) throw new Error(`Wallet charge failed: ${error.message}`);
  return data;
}

/** Convenience read — current wallet balance for a business. */
export async function getWalletBalance(supabase, businessId) {
  const { data, error } = await supabase.from("core_businesses").select("wallet_balance_naira").eq("id", businessId).single();
  if (error) throw new Error(`Failed to read wallet balance: ${error.message}`);
  return data.wallet_balance_naira;
}
