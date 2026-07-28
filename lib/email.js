/**
 * Minimal email layer using Resend (the TRD's recommended option alongside
 * Brevo). Kept as small, individually-callable functions rather than a
 * templating framework — the MVP should stay lightweight per TRD section 16.
 *
 * If RESEND_API_KEY isn't set (e.g. in local dev), these become no-ops that
 * log to the console instead of failing the calling request.
 */

const RESEND_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = process.env.EMAIL_FROM || "Commission <notifications@commission.ng>";

async function send({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email:noop] to=${to} subject="${subject}"`);
    return { skipped: true };
  }

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  });

  if (!res.ok) {
    // Email failures should never break the commission/payout flow that
    // triggered them — log and move on.
    console.error(`Resend send failed (${res.status}) for ${to}`);
    return { skipped: true };
  }
  return res.json();
}

function naira(amount) {
  return `₦${Number(amount).toLocaleString()}`;
}

export async function sendCommissionEarnedEmail({ to, name, amountNaira, productName, tier }) {
  return send({
    to,
    subject: `You earned ${naira(amountNaira)} on Commission`,
    html: `
      <p>Hi ${name || "there"},</p>
      <p>Your tier ${tier} referral link generated a sale on <strong>${productName}</strong>.</p>
      <p>You earned <strong>${naira(amountNaira)}</strong>. It's now pending payout.</p>
      <p>— Commission</p>
    `,
  });
}

export async function sendPayoutInitiatedEmail({ to, name, amountNaira }) {
  return send({
    to,
    subject: `Your ${naira(amountNaira)} payout is on its way`,
    html: `
      <p>Hi ${name || "there"},</p>
      <p>We've initiated a payout of <strong>${naira(amountNaira)}</strong> to your bank account via Paystack.</p>
      <p>It should land within a few business hours.</p>
      <p>— Commission</p>
    `,
  });
}

export async function sendPayoutPaidEmail({ to, name, amountNaira }) {
  return send({
    to,
    subject: `${naira(amountNaira)} has landed in your account`,
    html: `
      <p>Hi ${name || "there"},</p>
      <p>Your payout of <strong>${naira(amountNaira)}</strong> has been paid out successfully.</p>
      <p>— Commission</p>
    `,
  });
}
