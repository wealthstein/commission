import { NextResponse } from "next/server";
import { listBanks } from "@/lib/paystack";

/** GET /api/paystack/banks — list of Nigerian banks with their Paystack codes. */
export async function GET() {
  try {
    const banks = await listBanks();
    return NextResponse.json({ banks });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
