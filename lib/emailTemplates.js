// =========================================================
// lib/emailTemplates.js
// Every transactional, marketing, and revenue-driven email's actual HTML
// lives here, in code — not in Resend's dashboard. Resend is purely the
// sending infrastructure (deliverability, bounce handling); this file is
// the single source of truth for content. One function per notification
// type, each returning { subject, html }.
//
// Colors are verified directly against the real brand palette
// (lib/theme.js), not an approximation.
// =========================================================

// Colors below are now verified directly against the real brand palette
// (lib/theme.js) - the earlier version of this file had all four slightly
// wrong, having been written without access to that file at the time.
const BRAND = "#FFCB05"; // primary brand yellow
const BRAND_INK = "#4A3B00"; // dark text shown on top of BRAND
const INK = "#0B0B0C"; // primary text color
const MUTED = "#6B7280"; // secondary/muted text
const SUCCESS = "#12805C"; // green, used for positive amounts
const BORDER = "#E7E5DE";

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
              <p style="margin:0; font-size:11px; color:${MUTED}; text-align:center;">© ${new Date().getFullYear()} Commission &nbsp;•&nbsp; Built with ❤️ in Brooklyn, New York</p>
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
// OUTREACH STYLING - a distinct, left-aligned, card-based layout used only
// by the cold-outreach templates below, matching a founder-voiced reference
// sample. Kept separate from wrap()/heading()/paragraph() above rather than
// changing those, since transactional and wallet-nudge emails still use the
// original centered style and have no reason to change.
// ---------------------------------------------------------------------------

function outreachWrap(bodyContent, previewText = "") {
  // Hidden preheader text shown next to the subject line in inbox lists
  // (Gmail, Outlook, etc). The invisible padding characters after it stop
  // the email client from falling back to pulling in visible body text
  // (like the "Commission" wordmark) as the preview instead - same
  // technique used by the reference sample this layout is based on.
  const preheader = previewText
    ? `<div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">${previewText}<div>&#8203;&#847; &#8203;&#847; &#8203;&#847; &#8203;&#847; &#8203;&#847; &#8203;&#847; &#8203;&#847; &#8203;&#847; &#8203;&#847; &#8203;&#847;</div></div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
  </style>
</head>
<body style="margin:0; padding:0; background-color:#FAFAF8; ${FONT}">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
          <tr>
            <td style="padding-bottom:24px;">
              <span style="font-size:20px; font-weight:700; letter-spacing:-0.02em; color:${INK};">Commission</span>
            </td>
          </tr>
          <tr>
            <td style="background-color:#FFFFFF; border:1px solid ${BORDER}; border-radius:6px; padding:48px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${bodyContent}
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 0 0 0;">
              <span style="font-size:12px; color:${MUTED};">Commission • Built with ❤️ in Brooklyn, New York</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function outreachBadge(text) {
  return `<tr><td style="padding-bottom:24px;"><span style="display:inline-block; background-color:${BRAND}; color:${BRAND_INK}; border-radius:6px; padding:8px 12px; font-size:11px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase;">${text}</span></td></tr>`;
}

function outreachHeading(text) {
  return `<tr><td style="padding-bottom:28px;"><h1 style="margin:0; font-size:30px; line-height:1.25; font-weight:700; letter-spacing:-0.02em; color:${INK};">${text}</h1></td></tr>`;
}

function outreachParagraph(text) {
  return `<tr><td style="padding-bottom:20px;"><p style="margin:0; font-size:16px; line-height:1.7; color:${INK};">${text}</p></td></tr>`;
}

function outreachCallout(text) {
  return `<tr><td style="padding-bottom:28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background-color:#FAFAF8; border-left:4px solid ${BRAND}; padding:20px 24px; font-size:16px; line-height:1.7; color:${INK};">${text}</td></tr></table></td></tr>`;
}

function outreachButton(text, url) {
  return `<tr><td style="padding-bottom:8px;"><a href="${url}" style="display:inline-block; background-color:${BRAND}; color:${BRAND_INK}; text-decoration:none; font-weight:700; font-size:15px; padding:14px 28px; border-radius:6px;">${text}</a></td></tr>`;
}

function outreachSignature() {
  return `<tr><td style="padding-top:32px; margin-top:8px; border-top:1px solid ${BORDER};"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding-top:24px; font-size:16px; font-weight:600; color:${INK};">Bukola Banks</td></tr><tr><td style="font-size:14px; color:${MUTED};">Founder, Commission</td></tr></table></td></tr>`;
}

// ---------------------------------------------------------------------------
// TRANSACTIONAL
// ---------------------------------------------------------------------------

export function welcomeTemplate({ firstName }) {
  return {
    subject: "Thanks for registering with Commission",
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
// named person - firstName is the only personalization available.
// ---------------------------------------------------------------------------

export function coldOutreach1Template({ firstName }) {
  return {
    subject: "Pay for conversions, not clicks",
    html: outreachWrap(
      outreachBadge("Introducing Commission") +
      outreachHeading("A quick question") +
      outreachParagraph(`Good morning, ${firstName}!`) +
      outreachParagraph(
        "I'm reaching out from Commission - a performance-based customer acquisition platform for Nigerian businesses. In short: you list what you're selling, we connect you with affiliates who already have real, engaged audiences, and you only pay when someone actually converts."
      ) +
      outreachParagraph(
        "We work with businesses across HMOs, insurance, real estate, HR software, SaaS, and internet service providers - basically anywhere a trusted recommendation from a real person moves someone to actually buy, more than an ad ever does."
      ) +
      outreachParagraph(`Curious how you're currently finding new customers beyond word of mouth or running ads?`) +
      outreachCallout(
        "Commission is built so businesses only pay when something actually happens - an Intent Qualified Lead (IQL) or a verified sale, never for clicks or impressions. You set the price, affiliates share your link, commissions get paid out automatically."
      ) +
      outreachButton("See how it works", "https://www.commission.ng/") +
      outreachSignature(),
      "A performance-based way to find customers - you only pay when someone actually converts."
    ),
  };
}

export function coldOutreach2Template({ firstName }) {
  return {
    subject: "Your ads don't care about conversions",
    html: outreachWrap(
      outreachBadge("Performance-Based Growth") +
      outreachHeading("You pay either way with ads") +
      outreachParagraph(`Dear ${firstName},`) +
      outreachParagraph(
        `Most ad spend is paid upfront, whether or not it turns into a customer - you're betting on an algorithm, with no guarantee of a real result at the other end.`
      ) +
      outreachCallout(
        "Commission flips that - you only pay when a real Intent Qualified Lead or sale happens, and you're the one who sets what that's worth. An affiliate shares your link, the click gets tracked automatically, and payment only moves once a genuine result is confirmed."
      ) +
      outreachParagraph("No ad account needed, no bidding against competitors for the same keywords.") +
      outreachParagraph(
        "Every click gets its own tracked link, so there's no ambiguity about which affiliate brought in which customer - the attribution is automatic, not something you have to reconstruct after the fact."
      ) +
      outreachButton("See if this fits", "https://www.commission.ng/calculator?for=business") +
      outreachSignature(),
      "You set what a customer is worth to you - not an ad platform's auction."
    ),
  };
}

export function coldOutreach3Template({ firstName }) {
  return {
    subject: "How the affiliate side actually works",
    html: outreachWrap(
      outreachBadge("Built-In Distribution") +
      outreachHeading("The short version") +
      outreachParagraph(`Hello, ${firstName}!`) +
      outreachParagraph(
        `You list what you're selling, affiliates - people who already have an audience that trusts them - share a link, and when it converts, they earn a commission automatically.`
      ) +
      outreachCallout(
        "Up to 3 tiers deep, so an affiliate is even rewarded for bringing in other affiliates. Every referral also runs through Radar, Commission's built-in trust layer, before it reaches you - so what lands in your inbox is a genuine Intent Qualified Lead, not just raw traffic."
      ) +
      outreachParagraph("Setting up a campaign takes a few minutes, not a new ad account and a learning curve.") +
      outreachParagraph(
        "List what you're selling, set the commission you're comfortable paying, and your program is immediately discoverable to affiliates already active on Commission - no recruiting effort required on your end."
      ) +
      outreachButton("Open to a look?", "https://www.commission.ng/signup?role=business") +
      outreachSignature(),
      "Every referral is checked by Radar before it ever reaches you."
    ),
  };
}

export function coldOutreach4Template({ firstName }) {
  return {
    subject: "What's stopping you?",
    html: outreachWrap(
      outreachBadge("Free to Start") +
      outreachHeading("No fixed ad budget required") +
      outreachParagraph(`${firstName}, I'm here again!`) +
      outreachParagraph(`If this hasn't been a priority, that's completely fair.`) +
      outreachCallout(
        "Commission's Small Plan is genuinely free to start on, and the fee only applies to your Campaign Wallet top-up when you do fund one - nothing further is owed unless an Intent Qualified Lead or sale actually happens. There's no separate setup cost, no contract, no retainer."
      ) +
      outreachParagraph(
        "If you outgrow Small later, Medium and Large just lower the platform fee percentage and extend your attribution window - upgrading never changes how much a lead costs you, it just leaves more of the same budget as actual campaign spend."
      ) +
      outreachButton("See real examples", "https://www.commission.ng/signup?role=business") +
      outreachSignature(),
      "The Small plan is free to start on - nothing owed unless a real result happens."
    ),
  };
}

export function coldOutreach5Template({ firstName }) {
  return {
    subject: "Last note from Commission",
    html: outreachWrap(
      outreachHeading("I'll leave it here") +
      outreachParagraph(`Dear ${firstName},`) +
      outreachParagraph(
        `I didn't want to keep following up without a clear signal this is useful. Commission's the short version - list what you're selling, affiliates bring in customers, you only pay for a real result. If that becomes a priority down the line, commission.ng has the details whenever it's relevant.`
      ) +
      outreachParagraph("Wishing you well either way.") +
      outreachButton("Take a look when it's relevant", "https://www.commission.ng/signup?role=business") +
      outreachSignature(),
      "Commission, in one line: you only pay for a real result."
    ),
  };
}

// ---------------------------------------------------------------------------
// WALLET FUNDING NUDGES — real signed-up businesses who haven't funded
// their wallet yet (see app/api/cron/wallet-nudge). Day 0/3/6/9/12, then a
// 14-day pause and one repeat cycle before going quiet. Distinct from the
// cold-outreach sequence above - this is for real accounts, not a cold list.
// ---------------------------------------------------------------------------

export function walletNudge1Template({ businessName, walletUrl }) {
  return {
    subject: "One step left before your campaign can go live",
    html: wrap(
      heading("Almost there") +
      paragraph(
        `Hi ${businessName || "there"}, your campaign is set up - the only thing left is funding your Campaign Wallet so Commission can start charging for real Intent Qualified Leads or sales.`
      ) +
      button("Fund your wallet", walletUrl)
    ),
  };
}

export function walletNudge2Template({ businessName, walletUrl }) {
  return {
    subject: "Your affiliates are ready whenever you are",
    html: wrap(
      heading("Your campaign is waiting on one thing") +
      paragraph(
        `Hi ${businessName || "there"}, affiliates can see your campaign, but nothing gets billed - and nothing gets paid out - until your Campaign Wallet has a balance.`
      ) +
      button("Fund your wallet", walletUrl)
    ),
  };
}

export function walletNudge3Template({ businessName, walletUrl }) {
  return {
    subject: "How the wallet actually works",
    html: wrap(
      heading("No surprises, no recurring charge") +
      paragraph(
        `Hi ${businessName || "there"}, funding your wallet is a one-time top-up, not a subscription. Commission takes its fee once, at the moment you fund it - after that, every Intent Qualified Lead or verified sale pays your affiliates in full, automatically.`
      ) +
      button("Fund your wallet", walletUrl)
    ),
  };
}

export function walletNudge4Template({ businessName, walletUrl }) {
  return {
    subject: "In case something's unclear",
    html: wrap(
      heading("Happy to help if something's in the way") +
      paragraph(
        `Hi ${businessName || "there"}, if anything about funding your wallet is unclear - the amount, how the fee works, anything - just reply to this email and we'll sort it out directly.`
      ) +
      button("Fund your wallet", walletUrl)
    ),
  };
}

export function walletNudge5Template({ businessName, walletUrl }) {
  return {
    subject: "Last note on this for now",
    html: wrap(
      heading("We'll leave it here for now") +
      paragraph(
        `Hi ${businessName || "there"}, your campaign and Campaign Wallet are ready whenever you are - no pressure, no deadline. We'll check back in a couple of weeks.`
      ) +
      button("Fund your wallet", walletUrl)
    ),
  };
}

// ---------------------------------------------------------------------------
// AFFILIATE COLD OUTREACH — a separate ~100-contact list (real estate
// agents), 5 emails, same 3-day cadence as the business sequence, same
// cron (app/api/cron/outreach), distinguished by
// cold_outreach_contacts.audience = 'affiliate'. CTA drives to the
// affiliate calculator, not signup directly - showing the real numbers
// first, same principle as the business sequence.
// ---------------------------------------------------------------------------

export function affiliateOutreach1Template({ firstName }) {
  return {
    subject: "get paid for the referrals you're not personally closing",
    html: wrap(
      heading("A quick question") +
      paragraph(
        `Hi ${firstName}, you already send people to developers and businesses you trust - the question is whether you're getting paid for the ones you don't personally close yourself.`
      ) +
      paragraph(
        "Commission lets you share a link, and earn a real commission automatically whenever someone you referred qualifies as a genuine lead - tracked, paid, no chasing anyone for it."
      ) +
      button("See what you could earn", "https://www.commission.ng/calculator?for=affiliate")
    ),
  };
}

export function affiliateOutreach2Template({ firstName }) {
  return {
    subject: "no cost, no commitment to join",
    html: wrap(
      heading("Nothing to lose by trying it") +
      paragraph(
        `Hi ${firstName}, there's no cost to join as an affiliate - you share your own link, and only earn when it actually converts. If it's not for you, there's nothing to walk away from.`
      ) +
      button("See the numbers", "https://www.commission.ng/calculator?for=affiliate")
    ),
  };
}

export function affiliateOutreach3Template({ firstName }) {
  return {
    subject: "your referrals can earn you more than once",
    html: wrap(
      heading("It compounds") +
      paragraph(
        `Hi ${firstName}, when you bring another affiliate onto Commission, you earn a share of what they generate too - automatically, up to 3 tiers deep. The people you already know in the industry become part of your own earning network.`
      ) +
      button("See how it adds up", "https://www.commission.ng/calculator?for=affiliate")
    ),
  };
}

export function affiliateOutreach4Template({ firstName }) {
  return {
    subject: "how the payout actually works",
    html: wrap(
      heading("Straightforward, tracked automatically") +
      paragraph(
        `Hi ${firstName}, no manual invoicing, no chasing anyone for payment - commissions are calculated and paid out automatically once a referral qualifies, and you can see exactly what's owed at any time.`
      ) +
      button("Estimate your earnings", "https://www.commission.ng/calculator?for=affiliate")
    ),
  };
}

export function affiliateOutreach5Template({ firstName }) {
  return {
    subject: "last note on this for now",
    html: wrap(
      heading("I'll leave it here") +
      paragraph(
        `Hi ${firstName}, didn't want to keep following up without a clear signal this is useful. Your link is ready whenever you want it - commission.ng has the details.`
      )
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
  affiliateOutreach1: affiliateOutreach1Template,
  affiliateOutreach2: affiliateOutreach2Template,
  affiliateOutreach3: affiliateOutreach3Template,
  affiliateOutreach4: affiliateOutreach4Template,
  affiliateOutreach5: affiliateOutreach5Template,
  walletNudge1: walletNudge1Template,
  walletNudge2: walletNudge2Template,
  walletNudge3: walletNudge3Template,
  walletNudge4: walletNudge4Template,
  walletNudge5: walletNudge5Template,
};
