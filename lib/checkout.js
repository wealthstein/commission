import { calculateCommission } from "@/lib/commissionEngine";
import { initializeDirectSaleCheckout } from "@/lib/paystack";
import { feePercentForPlan } from "@/lib/pricingPlans";

async function resolveLineage(admin, enrollment) {
  const chain = [enrollment];
  let current = enrollment;
  while (chain.length < 3 && current.referrer_enrollment_id) {
    const { data: parent } = await admin
      .from("affiliate_enrollments")
      .select("*")
      .eq("id", current.referrer_enrollment_id)
      .maybeSingle();
    if (!parent) break;
    chain.push(parent);
    current = parent;
  }
  return chain;
}

/**
 * Builds the checkout for a 'sale'-goal campaign referral click and returns
 * the Paystack authorization_url to redirect the customer to. Used by
 * app/r/[code] the moment someone with a valid referral clicks through to
 * a sale-goal product.
 *
 * The commission split is computed HERE, before checkout even starts,
 * because Paystack needs the exact transaction_charge amount (what
 * Commission's main account keeps) up front - see lib/paystack.js's
 * initializeDirectSaleCheckout.
 */
export async function initiateCheckoutForReferral(admin, params) {
  const enrollment = params.enrollment;
  const program = params.program;
  const product = params.product;
  const business = params.business;
  const referralCode = params.referralCode;

  if (!business.paystack_subaccount_code) {
    throw new Error(
      "This business has not connected a settlement account yet, so Commission cannot route their share of the sale. Ask them to connect one from their Account page."
    );
  }

  const feePercent = feePercentForPlan(business.plan);
  const lineage = await resolveLineage(admin, enrollment);

  const result = calculateCommission({
    amountNaira: product.price_naira,
    program: { ...program, platform_fee_percent: feePercent },
    sellingEnrollment: enrollment,
    lookupEnrollment: (id) => lineage.find((e) => e.id === id) ?? null,
  });

  // Placeholder email - Paystack requires one to initialize a transaction,
  // but its own checkout page lets the customer edit it before paying, and
  // the webhook uses the REAL email Paystack captured at charge time.
  const checkout = await initializeDirectSaleCheckout({
    email: "customer@commission.ng",
    amountNaira: product.price_naira,
    productId: product.id,
    referralCode,
    subaccountCode: business.paystack_subaccount_code,
    transactionChargeNaira: result.totalCommissionNaira,
  });

  return checkout.authorization_url;
}
