// =========================================================
// lib/emailTemplates.js
// Every transactional, marketing, and revenue-driven email's actual HTML
// lives here, in code — not in Brevo's dashboard. Brevo is purely the
// sending infrastructure (deliverability, bounce handling); this file is
// the single source of truth for content. One function per notification
// type, each returning { subject, html }.
//
// Colors below are a close approximation of the site's actual brand
// palette (lib/theme.js) — that file could not be read while building
// this, so confirm/adjust BRAND and INK against the real tokens before
// this goes live.
// =========================================================

const BRAND = "#FFCB05"; // primary brand yellow (confirmed)
const BRAND_INK = "#14110F"; // dark text shown on top of BRAND
const INK = "#14110F"; // primary text color
const MUTED = "#6B6B6B"; // secondary/muted text
const SUCCESS = "#1F9D62"; // green, used for positive amounts
const BORDER = "#EDEBE3";

const LOGO = '<img src="https://commission.ng/circle.svg" width="36" height="36" style="display:block; border-radius:9px;" alt="Commission" />';
const FONT = "font-family:'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;";

function wrap(bodyContent) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Best-effort only - Gmail and Outlook desktop do not support custom
       web fonts in email at all and will always fall back to the system
       font stack in FONT below, regardless of this. This only helps in
       clients that do support it (Apple Mail, some webmail). */
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;800&display=swap');
  </style>
</head>
<body style="margin:0; padding:0; background-color:#FFFFFF; ${FONT}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding-bottom:32px;">${LOGO}</td></tr>
          ${bodyContent}
          <tr>
            <td style="border-top:1px solid ${BORDER}; padding-top:24px;">
              <p style="margin:0; font-size:11px; color:${MUTED}; text-align:center;">© ${new Date().getFullYear()} Commission &nbsp;•&nbsp; Built with ❤️ in Chicago, Illinois</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function heading(text) {
  return `<tr><td align="center" style="padding-bottom:8px;"><h1 style="margin:0; font-size:22px; font-weight:700; color:${INK};">${text}</h1></td></tr>`;
}

function paragraph(text) {
  return `<tr><td align="center" style="padding-bottom:24px;"><p style="margin:0; font-size:15px; color:${MUTED}; line-height:1.6;">${text}</p></td></tr>`;
}

function button(text, url) {
  return `<tr><td align="center" style="padding-bottom:32px;"><a href="${url}" style="display:inline-block; background-color:${BRAND}; color:${BRAND_INK}; text-decoration:none; font-weight:700; font-size:14px; padding:14px 32px; border-radius:16px;">${text}</a></td></tr>`;
}

function amountBox(amount, color = SUCCESS) {
  return `<tr><td align="center" style="padding-bottom:32px;"><div style="display:inline-block; background-color:#F7F6F2; border-radius:16px; padding:16px 32px;"><span style="font-size:28px; font-weight:800; color:${color};">${amount}</span></div></td></tr>`;
}

function detailRows(pairs) {
  const rows = pairs
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 0; font-size:13px; color:${MUTED};">${label}</td><td align="right" style="padding:8px 0; font-size:13px; font-weight:600; color:${INK};">${value}</td></tr>`
    )
    .join("");
  return `<tr><td style="padding-bottom:24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>`;
}

function naira(amount) {
  return `₦${Number(amount).toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// TRANSACTIONAL
// ---------------------------------------------------------------------------

export function welcomeTemplate({ firstName }) {
  return {
    subject: "Welcome to Commission",
    html: wrap(
      heading(`Hi, ${firstName}!`) +
      paragraph(
        "Thank you for your interest in joining Commission. We are currently reviewing your account and will contact you soon regarding next steps."
      )
    ),
  };
}

export function approvalTemplate({ firstName, dashboardUrl }) {
  return {
    subject: "You're approved - your Commission dashboard is ready",
    html: wrap(
      heading("You're in!") +
      paragraph(`Hi ${firstName}, your Commission account has been approved. Your dashboard is ready whenever you are.`) +
      button("Go to your dashboard", dashboardUrl)
    ),
  };
}

export function commissionEarnedTemplate({ name, amountNaira, productName, tier }) {
  return {
    subject: `You earned ${naira(amountNaira)} on Commission`,
    html: wrap(
      heading("You just earned a commission") +
      paragraph(`Hi ${name || "there"}, your tier ${tier} referral link generated a sale on <strong>${productName}</strong>.`) +
      amountBox(naira(amountNaira)) +
      paragraph("This is now pending payout - no action needed on your end.")
    ),
  };
}

export function payoutInitiatedTemplate({ name, amountNaira }) {
  return {
    subject: `Your ${naira(amountNaira)} payout is on its way`,
    html: wrap(
      heading("Payout on its way") +
      paragraph(`Hi ${name || "there"}, we've initiated your payout via Paystack.`) +
      amountBox(naira(amountNaira)) +
      paragraph("It should land in your account within a few business hours.")
    ),
  };
}

export function payoutPaidTemplate({ name, amountNaira }) {
  return {
    subject: `${naira(amountNaira)} has landed in your account`,
    html: wrap(
      heading("Payout complete") +
      paragraph(`Hi ${name || "there"}, the payout below has been paid out successfully.`) +
      amountBox(naira(amountNaira))
    ),
  };
}

export function payoutFailedTemplate({ name, amountNaira, accountSettingsUrl }) {
  return {
    subject: `We couldn't complete your ${naira(amountNaira)} payout`,
    html: wrap(
      heading("Payout could not be completed") +
      paragraph(
        `Hi ${name || "there"}, a payout of <strong>${naira(amountNaira)}</strong> could not be sent to your bank account - usually because the account details on file are outdated or incorrect.`
      ) +
      button("Update your bank details", accountSettingsUrl) +
      paragraph("Nothing is lost - this amount is still owed to you and will be retried once your details are updated.")
    ),
  };
}

export function leadDetailsTemplate({ businessName, productName, fullName, phone, email, details, customFieldAnswers }) {
  const customFieldsRows = (customFieldAnswers || []).map((f) => [f.label, f.value]);
  return {
    subject: `New Intent Qualified Lead for ${productName}`,
    html: wrap(
      heading("New Intent Qualified Lead") +
      paragraph(`Hi ${businessName || "there"}, a new lead just completed the full qualification form for <strong>${productName}</strong>.`) +
      detailRows([["Name", fullName], ["Phone", phone], ["Email", email], ["Details", details], ...customFieldsRows]) +
      paragraph(
        "This lead has been billed to your Campaign Wallet and your affiliates have been paid. Commission does not keep a copy of these details on file - this email and your own records are the only place they live."
      )
    ),
  };
}

export function teamInviteTemplate({ businessName, invitedByName, role, acceptUrl }) {
  return {
    subject: `${invitedByName || "Someone"} invited you to join ${businessName} on Commission`,
    html: wrap(
      heading("You've been invited") +
      paragraph(
        `${invitedByName || "A teammate"} invited you to join <strong>${businessName}</strong>'s Commission account as ${role === "admin" ? "an admin" : "a team member"}.`
      ) +
      button("Accept invite", acceptUrl) +
      paragraph("You'll sign in with the Google account this invite was sent to.")
    ),
  };
}

export function teamInviteAcceptedTemplate({ inviterName, memberEmail, businessName, teamUrl }) {
  return {
    subject: `${memberEmail} joined ${businessName} on Commission`,
    html: wrap(
      heading("Your teammate is in") +
      paragraph(`Hi ${inviterName || "there"}, <strong>${memberEmail}</strong> just accepted your invite to ${businessName}.`) +
      button("Manage your team", teamUrl)
    ),
  };
}

export function walletToppedUpTemplate({ businessName, amountNaira, newBalanceNaira }) {
  return {
    subject: `Your Campaign Wallet was topped up by ${naira(amountNaira)}`,
    html: wrap(
      heading("Wallet top-up confirmed") +
      paragraph(`Hi ${businessName || "there"}, your Campaign Wallet top-up was successful.`) +
      amountBox(naira(amountNaira)) +
      detailRows([["New wallet balance", naira(newBalanceNaira)]])
    ),
  };
}

export function walletLowBalanceTemplate({ businessName, balanceNaira, walletUrl }) {
  return {
    subject: "Your Campaign Wallet is running low",
    html: wrap(
      heading("Time to top up") +
      paragraph(
        `Hi ${businessName || "there"}, your Campaign Wallet balance is down to <strong>${naira(balanceNaira)}</strong>. Once it runs out, new Intent Qualified Leads won't be able to qualify until you top up.`
      ) +
      button("Top up your wallet", walletUrl)
    ),
  };
}

// ---------------------------------------------------------------------------
// MARKETING
// ---------------------------------------------------------------------------

export function pendingApprovalFollowUpTemplate({ firstName, calculatorUrl }) {
  return {
    subject: "While you wait - here's how Commission actually works",
    html: wrap(
      heading(`Hi, ${firstName}`) +
      paragraph(
        "Your account is still being reviewed - in the meantime, here's the short version of how Commission works: businesses set what a qualified lead or sale is worth, affiliates share a link, and commissions get paid automatically, up to 3 tiers deep."
      ) +
      button("See the numbers for yourself", calculatorUrl)
    ),
  };
}

export function newLiveProgramTemplate({ firstName, industryName, programUrl }) {
  return {
    subject: `A new ${industryName} program just went live`,
    html: wrap(
      heading("New program to promote") +
      paragraph(`Hi ${firstName}, a new ${industryName} program just went live on Commission - be one of the first to share it.`) +
      button("View the program", programUrl)
    ),
  };
}

export function dormantAffiliateTemplate({ firstName, discoverUrl }) {
  return {
    subject: "Your referral link is still live",
    html: wrap(
      heading("Ready when you are") +
      paragraph(`Hi ${firstName}, it's been a while since you last shared a link. There are live programs on Commission ready to promote today.`) +
      button("Browse programs", discoverUrl)
    ),
  };
}

export function referAffiliateTemplate({ firstName, referralUrl }) {
  return {
    subject: "Earn from every affiliate you bring in, not just yourself",
    html: wrap(
      heading("Your network earns you more") +
      paragraph(
        `Hi ${firstName}, every affiliate you refer to Commission puts you a tier above them - you earn a share of what they generate too, automatically, on top of your own referrals.`
      ) +
      button("Share your invite link", referralUrl) +
      paragraph("Up to 3 tiers deep - the more people you bring in, the more this compounds.")
    ),
  };
}

// ---------------------------------------------------------------------------
// REVENUE-DRIVEN
// ---------------------------------------------------------------------------

export function planLimitHitTemplate({ businessName, limitDescription, pricingUrl }) {
  return {
    subject: "You've hit a plan limit on Commission",
    html: wrap(
      heading("You're growing - your plan should too") +
      paragraph(`Hi ${businessName || "there"}, ${limitDescription} Upgrading removes this limit and unlocks Lead Management, Team Management, and Custom Fields.`) +
      button("Compare plans", pricingUrl)
    ),
  };
}

export function renewalFailedTemplate({ businessName, planName, updatePaymentUrl }) {
  return {
    subject: "Your Commission subscription payment failed",
    html: wrap(
      heading("Payment could not be processed") +
      paragraph(
        `Hi ${businessName || "there"}, we couldn't process this month's payment for your <strong>${planName}</strong> plan. Please update your payment method to avoid any interruption.`
      ) +
      button("Update payment method", updatePaymentUrl)
    ),
  };
}

// ---------------------------------------------------------------------------
// COLD OUTREACH — the 300-business list, 5 emails, 3 days apart (see
// app/api/cron/outreach). Sent to a generic inbox (info@, hi@, etc.), not a
// named person - companyName is the only personalization available.
// ---------------------------------------------------------------------------

export function coldOutreach1Template({ companyName }) {
  return {
    subject: `quick question about how ${companyName} finds new customers`,
    html: wrap(
      heading("A quick question") +
      paragraph(`Hi ${companyName} team, curious how you're currently finding new customers beyond word of mouth.`) +
      paragraph(
        "Commission is built so businesses only pay when something actually happens - a qualified lead or a verified sale, never for clicks or impressions. You set the price, affiliates share your link, commissions get paid out automatically."
      ) +
      button("See how it works", "https://commission.ng")
    ),
  };
}

export function coldOutreach2Template({ companyName }) {
  return {
    subject: "the risk with ads is you pay whether or not it works",
    html: wrap(
      heading("You pay either way with ads") +
      paragraph(
        `Hi ${companyName} team, most ad spend is paid upfront, whether or not it turns into a customer. Commission flips that - you only pay when a real qualified lead or sale happens, and you're the one who sets what that's worth.`
      ) +
      paragraph("No ad account needed, no bidding against competitors for the same keywords.") +
      button("See if this fits", "https://commission.ng")
    ),
  };
}

export function coldOutreach3Template({ companyName }) {
  return {
    subject: "how the affiliate side actually works",
    html: wrap(
      heading("The short version") +
      paragraph(
        `Hi ${companyName} team, you list what you're selling, affiliates - people who already have an audience that trusts them - share a link, and when it converts, they earn a commission automatically. Up to 3 tiers deep, so an affiliate is even rewarded for bringing in other affiliates.`
      ) +
      paragraph("Setting up a campaign takes a few minutes, not a new ad account and a learning curve.") +
      button("Open to a look?", "https://commission.ng")
    ),
  };
}

export function coldOutreach4Template({ companyName }) {
  return {
    subject: "in case cost or setup was the hesitation",
    html: wrap(
      heading("No fixed ad budget required") +
      paragraph(
        `Hi ${companyName} team, if this hasn't been a priority, that's completely fair. Just flagging that Commission's fee only applies to your Campaign Wallet top-up - nothing further is owed unless a lead or sale actually happens.`
      ) +
      button("See real examples", "https://commission.ng")
    ),
  };
}

export function coldOutreach5Template({ companyName }) {
  return {
    subject: "last note from Commission",
    html: wrap(
      heading("I'll leave it here") +
      paragraph(
        `Hi ${companyName} team, didn't want to keep following up without a clear signal this is useful. If customer acquisition becomes a priority down the line, commission.ng has the details whenever it's relevant.`
      ) +
      paragraph(`Wishing ${companyName} well either way.`)
    ),
  };
}

export const EMAIL_TEMPLATES = {
  welcome: welcomeTemplate,
  approval: approvalTemplate,
  commissionEarned: commissionEarnedTemplate,
  payoutInitiated: payoutInitiatedTemplate,
  payoutPaid: payoutPaidTemplate,
  payoutFailed: payoutFailedTemplate,
  leadDetails: leadDetailsTemplate,
  teamInvite: teamInviteTemplate,
  teamInviteAccepted: teamInviteAcceptedTemplate,
  walletToppedUp: walletToppedUpTemplate,
  walletLowBalance: walletLowBalanceTemplate,
  pendingApprovalFollowUp: pendingApprovalFollowUpTemplate,
  newLiveProgram: newLiveProgramTemplate,
  dormantAffiliate: dormantAffiliateTemplate,
  referAffiliate: referAffiliateTemplate,
  planLimitHit: planLimitHitTemplate,
  renewalFailed: renewalFailedTemplate,
  coldOutreach1: coldOutreach1Template,
  coldOutreach2: coldOutreach2Template,
  coldOutreach3: coldOutreach3Template,
  coldOutreach4: coldOutreach4Template,
  coldOutreach5: coldOutreach5Template,
};