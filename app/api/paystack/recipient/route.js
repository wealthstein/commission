import { NextResponse } from "next/server";
import { resolveAccountNumber, createTransferRecipient } from "@/lib/paystack";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * POST /api/paystack/recipient
 * body: { bankCode, accountNumber }
 *
 * Registers (or re-registers) the signed-in user's payout destination.
 * This is what lets the payout batching job (app/api/payouts/run) actually
 * send commissions to an affiliate's bank account.
 */
export async function POST(req) {
  const { bankCode, accountNumber } = await req.json();
  if (!bankCode || !accountNumber) {
    return NextResponse.json({ error: "bankCode and accountNumber are required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const resolved = await resolveAccountNumber({ accountNumber, bankCode });

    const recipient = await createTransferRecipient({
      name: resolved.account_name,
      accountNumber,
      bankCode,
    });

    const { error: updateError } = await supabase
      .from("users")
      .update({
        bank_code: bankCode,
        bank_account_number: accountNumber,
        bank_account_name: resolved.account_name,
        paystack_recipient_code: recipient.recipient_code,
      })
      .eq("auth_user_id", authUser.id);
    if (updateError) throw updateError;

    return NextResponse.json({ accountName: resolved.account_name, recipientCode: recipient.recipient_code });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
