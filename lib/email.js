/**
 * Sends transactional, marketing, and revenue-driven email via Brevo.
 * Brevo is purely the delivery transport here - every template's actual
 * subject/HTML content lives in lib/emailTemplates.js, not in Brevo's own
 * dashboard, so it stays version-controlled and reviewable like any other
 * code change.
 *
 * If BREVO_API_KEY is not set (e.g. in local dev), send() becomes a no-op
 * that logs to the console instead of failing the calling request - same
 * graceful-degradation behavior as before.
 */
import * as templates from "@/lib/emailTemplates";

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "Commission";
const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || "notifications@commission.ng";

async function send(to, { subject, html }) {
  if (!process.env.BREVO_API_KEY) {
    console.log(`[email:noop] to=${to} subject="${subject}"`);
    return { skipped: true };
  }

  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_ADDRESS },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    // Email failures should never break the commission/payout flow that
    // triggered them - log and move on.
    console.error(`Brevo send failed (${res.status}) for ${to}`);
    return { skipped: true };
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// TRANSACTIONAL - existing function names/signatures kept identical so
// every current call site (lib/leadQualification.js, lib/leadForwarding.js,
// app/api/paystack/webhook, app/api/payouts/run, app/api/sales/.../verify,
// app/api/team/invite) keeps working unchanged.
// ---------------------------------------------------------------------------

export async function sendCommissionEarnedEmail({ to, name, amountNaira, productName, tier }) {
  return send(to, templates.commissionEarnedTemplate({ name, amountNaira, productName, tier }));
}

export async function sendPayoutInitiatedEmail({ to, name, amountNaira }) {
  return send(to, templates.payoutInitiatedTemplate({ name, amountNaira }));
}

export async function sendPayoutPaidEmail({ to, name, amountNaira }) {
  return send(to, templates.payoutPaidTemplate({ name, amountNaira }));
}

export async function sendLeadDetailsEmail({ to, businessName, productName, fullName, phone, email, details, customFieldAnswers }) {
  return send(to, templates.leadDetailsTemplate({ businessName, productName, fullName, phone, email, details, customFieldAnswers }));
}

export async function sendTeamInviteEmail({ to, businessName, invitedByName, role, acceptUrl }) {
  return send(to, templates.teamInviteTemplate({ businessName, invitedByName, role, acceptUrl }));
}

// ---------------------------------------------------------------------------
// NEW - not yet wired into any trigger point. Each one needs a real event
// to call it from (e.g. approval needs an admin action or DB trigger for
// access_granted flipping true; renewalFailed needs a Paystack subscription
// webhook that does not exist yet). Building the templates and the trigger
// points are two different jobs - these are ready to call the moment the
// trigger exists.
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail({ to, firstName }) {
  return send(to, templates.welcomeTemplate({ firstName }));
}

export async function sendApprovalEmail({ to, firstName, dashboardUrl }) {
  return send(to, templates.approvalTemplate({ firstName, dashboardUrl }));
}

export async function sendPayoutFailedEmail({ to, name, amountNaira, accountSettingsUrl }) {
  return send(to, templates.payoutFailedTemplate({ name, amountNaira, accountSettingsUrl }));
}

export async function sendTeamInviteAcceptedEmail({ to, inviterName, memberEmail, businessName, teamUrl }) {
  return send(to, templates.teamInviteAcceptedTemplate({ inviterName, memberEmail, businessName, teamUrl }));
}

export async function sendWalletToppedUpEmail({ to, businessName, amountNaira, newBalanceNaira }) {
  return send(to, templates.walletToppedUpTemplate({ businessName, amountNaira, newBalanceNaira }));
}

export async function sendWalletLowBalanceEmail({ to, businessName, balanceNaira, walletUrl }) {
  return send(to, templates.walletLowBalanceTemplate({ businessName, balanceNaira, walletUrl }));
}

// ---------------------------------------------------------------------------
// MARKETING
// ---------------------------------------------------------------------------

export async function sendPendingApprovalFollowUpEmail({ to, firstName, calculatorUrl }) {
  return send(to, templates.pendingApprovalFollowUpTemplate({ firstName, calculatorUrl }));
}

export async function sendNewLiveProgramEmail({ to, firstName, industryName, programUrl }) {
  return send(to, templates.newLiveProgramTemplate({ firstName, industryName, programUrl }));
}

export async function sendDormantAffiliateEmail({ to, firstName, discoverUrl }) {
  return send(to, templates.dormantAffiliateTemplate({ firstName, discoverUrl }));
}

export async function sendReferAffiliateEmail({ to, firstName, referralUrl }) {
  return send(to, templates.referAffiliateTemplate({ firstName, referralUrl }));
}

// ---------------------------------------------------------------------------
// REVENUE-DRIVEN
// ---------------------------------------------------------------------------

export async function sendPlanLimitHitEmail({ to, businessName, limitDescription, pricingUrl }) {
  return send(to, templates.planLimitHitTemplate({ businessName, limitDescription, pricingUrl }));
}

export async function sendRenewalFailedEmail({ to, businessName, planName, updatePaymentUrl }) {
  return send(to, templates.renewalFailedTemplate({ businessName, planName, updatePaymentUrl }));
}

// ---------------------------------------------------------------------------
// COLD OUTREACH - see app/api/cron/outreach for the actual sending logic
// (which contact gets which step, and when).
// ---------------------------------------------------------------------------

export async function sendColdOutreachEmail(step, { to, firstName, companyName, audience = "business" }) {
  const prefix = audience === "affiliate" ? "affiliateOutreach" : "coldOutreach";
  const templateFn = templates[`${prefix}${step}Template`];
  if (!templateFn) throw new Error(`No ${audience} outreach template for step ${step}`);
  return send(to, templateFn({ firstName, companyName }));
}

// ---------------------------------------------------------------------------
// WALLET FUNDING NUDGES - see app/api/cron/wallet-nudge for the sending logic.
// ---------------------------------------------------------------------------

export async function sendWalletNudgeEmail(step, { to, businessName, walletUrl }) {
  const templateFn = templates[`walletNudge${step}Template`];
  if (!templateFn) throw new Error(`No wallet nudge template for step ${step}`);
  return send(to, templateFn({ businessName, walletUrl }));
}

// ---------------------------------------------------------------------------
// OUTBOUND / GROWTH CAMPAIGNS - for sending to a manually-curated list
// (e.g. the 300-business canvass list), not tied to any in-app trigger.
// ---------------------------------------------------------------------------

export async function sendColdOutreachStep1Email({ to, firstName, companyName, industryName, ppqlNaira, signupUrl }) {
  return send(to, templates.coldOutreachStep1Template({ firstName, companyName, industryName, ppqlNaira, signupUrl }));
}

export async function sendColdOutreachStep2Email({ to, firstName, companyName, calculatorUrl }) {
  return send(to, templates.coldOutreachStep2Template({ firstName, companyName, calculatorUrl }));
}

export async function sendColdOutreachStep3Email({ to, firstName, signupUrl }) {
  return send(to, templates.coldOutreachStep3Template({ firstName, signupUrl }));
}

export async function sendAffiliateReferralCanvassEmail({ to, firstName, referralLink, tier2Percent }) {
  return send(to, templates.affiliateReferralCanvassTemplate({ firstName, referralLink, tier2Percent }));
}
