/**
 * Sends transactional, marketing, and revenue-driven email via Resend.
 * Resend is purely the delivery transport here - every template's actual
 * subject/HTML content lives in lib/emailTemplates.js, not in Resend's own
 * dashboard, so it stays version-controlled and reviewable like any other
 * code change.
 *
 * If RESEND_API_KEY is not set (e.g. in local dev), send() becomes a no-op
 * that logs to the console instead of failing the calling request.
 *
 * Every email in this app goes through Resend - there is no other email
 * provider used anywhere in this codebase. commission.ng and
 * reply.commission.ng are both verified in Resend (the latter
 * specifically for inbound reply detection on cold outreach - see
 * app/api/webhooks/resend-inbound).
 */
import * as templates from "@/lib/emailTemplates";

const RESEND_URL = "https://api.resend.com/emails";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "Commission";
const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || "notifications@commission.ng";

// Deliberately separate from FROM_ADDRESS above - cold outreach sends from
// commission.ng, but replies route to reply.commission.ng specifically,
// which is the subdomain actually configured for Resend's inbound
// webhook. Sending replies to the same address used for everything else
// would mean replies land in a normal inbox, invisible to the reply
// webhook that marks a contact as 'replied'. Every other email in this
// file uses the default FROM_ADDRESS/no special reply-to, since only
// cold outreach is part of a reply-detected sequence.
const OUTREACH_FROM_ADDRESS = process.env.OUTREACH_FROM_ADDRESS || "hello@commission.ng";
const OUTREACH_REPLY_TO = process.env.OUTREACH_REPLY_TO || "reply@reply.commission.ng";
// A personal founder name fits cold outreach's founder-voiced emails, but
// shouldn't change what transactional emails (commission earned, payout
// status) show as their sender - those stay as FROM_NAME ("Commission")
// above.
const OUTREACH_FROM_NAME = process.env.OUTREACH_FROM_NAME || "Kemi Banks";

async function sendVia(to, { subject, html }, { fromAddress = FROM_ADDRESS, fromName = FROM_NAME, replyTo, scheduledAt } = {}) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email:noop] to=${to} subject="${subject}"${scheduledAt ? ` scheduled_at=${scheduledAt}` : ""}`);
    return { skipped: true };
  }

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromAddress}>`,
      to: [to],
      ...(replyTo ? { reply_to: replyTo } : {}),
      // Resend's own limit is 30 days ahead - a 12-day sequence is well
      // within that, no chunking/re-scheduling logic needed.
      ...(scheduledAt ? { scheduled_at: scheduledAt } : {}),
      subject,
      html,
    }),
  });

  if (!res.ok) {
    // Email failures should never break the commission/payout flow that
    // triggered them - log and move on.
    const errorBody = await res.text();
    console.error(`Resend send failed (${res.status}) for ${to}:`, errorBody);
    return { skipped: true };
  }
  return res.json();
}

async function send(to, { subject, html }) {
  return sendVia(to, { subject, html });
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

export async function sendColdOutreachEmail(step, { to, firstName, audience = "business", scheduledAt } = {}) {
  const prefix = audience === "affiliate" ? "affiliateOutreach" : "coldOutreach";
  const templateFn = templates[`${prefix}${step}Template`];
  if (!templateFn) throw new Error(`No ${audience} outreach template for step ${step}`);

  const result = await sendVia(to, templateFn({ firstName }), {
    fromAddress: OUTREACH_FROM_ADDRESS,
    fromName: OUTREACH_FROM_NAME,
    replyTo: OUTREACH_REPLY_TO,
    scheduledAt,
  });

  // Both the legacy cron-based sequence and the newer upfront-scheduling
  // flow (app/api/admin/outreach-contacts) need to know if this genuinely
  // failed, unlike every other email in this app. sendVia() itself never
  // throws (a failed "commission earned" email, for example, should never
  // break the payout flow it's attached to) - this is the caller that
  // actually needs the failure surfaced, so it's checked and thrown here
  // instead of changing sendVia() itself for every other caller.
  if (result?.skipped) {
    throw new Error(`Cold outreach email to ${to} was not actually sent (see server logs for the real Resend error)`);
  }

  return result;
}

/**
 * Cancels a not-yet-sent scheduled email via Resend's cancel endpoint.
 * Used by the reply-detection webhook (app/api/webhooks/resend-inbound) to
 * actually stop the remaining emails in a cold-outreach sequence the
 * moment a business replies, rather than relying on a cron to notice a
 * status flag later. Silently no-ops on failure (e.g. the email already
 * sent, or the ID is invalid) - a reply arriving a few seconds after an
 * email already went out is a real race condition, not a bug worth
 * surfacing as an error.
 */
export async function cancelScheduledEmail(emailId) {
  if (!emailId || !process.env.RESEND_API_KEY) return { skipped: true };

  const res = await fetch(`${RESEND_URL}/${emailId}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`Failed to cancel scheduled email ${emailId} (${res.status}):`, errorBody);
    return { skipped: true };
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// WALLET FUNDING NUDGES - see app/api/cron/wallet-nudge for the sending logic.
// ---------------------------------------------------------------------------

export async function sendWalletNudgeEmail(step, { to, businessName, walletUrl }) {
  const templateFn = templates[`walletNudge${step}Template`];
  if (!templateFn) throw new Error(`No wallet nudge template for step ${step}`);
  return send(to, templateFn({ businessName, walletUrl }));
}