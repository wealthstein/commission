# Commission (commission.ng)

A performance-based customer acquisition platform for Nigerian businesses — a business lists a product or service
and sets what a qualified lead or sale is worth to them; affiliates share a unique referral link and earn one-time
or recurring commissions, up to 3 tiers deep, paid out automatically via Paystack. **Radar**, Commission's built-in
trust layer, tracks every affiliate's real qualification history and decides — automatically, lead by lead — whether
extra verification is needed before a prospect reaches the business.

---

## ⚠️ One feature is currently disabled via environment variable

**`DISABLE_RADAR_OTP=true`** is set right now, and needs to be removed (or set to anything other than `"true"`)
before this is genuinely production-ready. It skips Radar's inline OTP step on the Interest Form entirely — every
lead is currently treated as coming from a Trusted affiliate.

This exists because the SMS provider account(s) needed to actually send OTPs are still pending activation (see
**SMS/OTP providers** below). Nothing about the feature was removed — the UI, the API routes, the database columns
are all fully built — this flag just skips the part that depends on a working SMS send. Search
`app/api/leads/capture/route.js` for exactly where it's checked.

Account-level phone verification (a separate feature from Radar's own OTP) was **removed from the app entirely**,
not disabled — see `supabase/migration_remove_phone_verification.sql`. The phone field itself is untouched and
still used by the same-number fraud check below; only the verification step and its two supporting columns are
gone.

---

## What's built

| Area | Where | Notes |
|---|---|---|
| Database schema | `supabase/schema.sql` + `supabase/migration_*.sql` | Unified `users` table, businesses, products, 3-tier `affiliate_programs`, referral clicks, transactions, commission ledger, payouts, leads, RLS policies. Migrations were added incrementally — run every `migration_*.sql` file in `supabase/`, not just `schema.sql` alone |
| Commission engine | `lib/commissionEngine.js` | Pure calculation module — tier lineage walk, per-tier commission + platform fee. Unit tested, run `npm test` |
| Paystack webhook | `app/api/paystack/webhook/route.js` | Handles wallet top-ups, direct sales, and **subscription renewals** — Paystack does not carry custom metadata forward onto renewal charges, so renewal attribution is looked up from `subscription_attribution` (written on the first charge) instead |
| Referral links | `app/r/[code]/route.js` | `commission.ng/r/ABC123` — tracks the click, sets an attribution cookie, redirects onward |
| Google Sign-In | `app/api/auth/callback/route.js`, `components/marketing/AuthPage.js` | Supabase Auth OAuth exchange, upserts into the unified `users` table. Dashboard access is gated by `users.access_granted` (manual DB update for now, no admin UI yet) |
| Marketing site | `app/page.js` + `components/marketing/*` | Business/affiliate audience toggle, pSEO pages (industries, comparisons, campaigns, features, solutions, integrations, locations, challenges), the `/radar` page, company/industry keyword-target pages |
| Dashboard | `app/dashboard/*` | Home, Discover, My Campaigns, My Promotions, Transactions (Payouts + Leads tabs, both on real data), Account (Account/Wallet/Subscriptions/Business/Bank tabs) |

### Radar — the trust layer

| Area | Where | Notes |
|---|---|---|
| Trust score | `lib/trustScore.js` | Platform-wide, all-time qualified-leads ÷ total-captured-leads per affiliate. Recalculated fresh on every check, never cached — there is no separate decay job, recalculating from raw totals IS the decay mechanism |
| Inline OTP (Interest Form) | `components/marketing/LeadShortForm.js`, `app/api/leads/capture/route.js`, `app/api/leads/verify-otp/route.js` | Trusted affiliates skip straight through; unproven affiliates see a 6-digit field on the same page, no redirect |
| Same-number fraud check | `app/api/leads/capture/route.js`, `app/api/leads/external-capture/route.js` | A submitted customer phone can't match the referring affiliate's own phone on file. Doesn't catch a second SIM or a cooperating friend's number, but stops the laziest self-dealing case — and Nigeria's 5-SIM-per-NIN cap keeps the harder version genuinely inconvenient to scale |

### Custom integration (Medium/Large plans)

A business can capture and qualify leads on their **own site** instead of Commission's hosted pages.

| Area | Where | Notes |
|---|---|---|
| Tracking script | `public/commission-track.js` | One `<script>` tag + `Commission.trackLead()` from the business's own form. Skips Radar's OTP at capture time — that step depends on Commission's own hosted page |
| External capture | `app/api/leads/external-capture/route.js` | Plan-gated server-side, not just hidden in the UI. Stages phone/name/email/metadata in `external_lead_pending` (short-lived, deleted on use) since capture-time data isn't otherwise stored |
| Embedded qualification widget | `app/embed/qualify/[leadRef]/page.js`, `Commission.renderQualifyWidget()` | Runs Radar's OTP **regardless of affiliate trust status, every time** — unlike capture-time Radar. This is deliberate: capture-time trust and "is this really the customer confirming" are different questions, and a Trusted affiliate can self-deal exactly as easily as a new one. Submission happens inside Commission's own iframe, not the business's code — that's what stops the business (or a self-dealing affiliate) from intercepting or faking it |

### Multi-tier affiliate recruitment

| Area | Where | Notes |
|---|---|---|
| Join API | `app/api/enrollments/join/route.js` | The one place `affiliate_enrollments` rows get created now — both Discover's join button and the public join page route through here. Validates tier depth via `buildLineage`/`assertWithinMaxTiers` (the same functions the webhook already uses at payout time) before setting `referrer_enrollment_id` |
| Recruitment link | `app/dashboard/promotions/page.js` | Each affiliate gets an "Invite a sub-affiliate" link, separate from their customer referral link — `?ref=` on the public join page carries the inviter's own referral code |
| Public join page | `app/products/[businessSlug]/[productSlug]/join/page.js` | Was a dead link until this was built (pointed at an unhandled homepage query param). Handles both logged-out (prompts signup) and logged-in (real enrollment insert) |

### Lead lifecycle

| Area | Where | Notes |
|---|---|---|
| Qualification | `app/api/leads/continue/route.js` | The Intent Form — the only path to `status='qualified'`. No manual qualification exists anywhere; a lead is only ever qualified by the customer's own action |
| Manual rejection | `app/api/leads/[leadId]/reject/route.js`, Transactions → Leads tab | A business can mark a `captured` lead invalid with a required reason. Deliberately does NOT feed into Radar's trust scoring — same self-report reasoning as everywhere else this came up |
| Auto-expiry | `app/api/cron/expire-stale-leads/route.js` | A `captured` lead older than 30 days auto-rejects. **Not a native Vercel cron** — same external-scheduler pattern as `outreach`/`wallet-nudge` below, needs to be added to whatever's already triggering those |

### Recurring/subscription commissions

| Area | Where | Notes |
|---|---|---|
| Attribution table | `supabase/migration_subscription_attribution.sql` | Maps Paystack's `(customer_code, plan_code)` to `(product_id, enrollment_id, business_id)` — written on the first charge, read on every renewal |
| Backfill | `app/api/admin/backfill-subscription-attribution/route.js` | One-off, `CRON_SECRET`-protected. Only needed if subscriptions existed before this feature shipped |

### SMS/OTP providers

| Area | Where | Notes |
|---|---|---|
| Provider switch | `lib/sms.js` | Every caller in the app imports from here, never a specific provider directly. `SMS_PROVIDER=termii` or `sendchamp` — switching is a one-line env var change, no code change |
| Termii | `lib/termii.js` | Blocked on "Country Inactive" — needs country/DND activation from Termii support, unresolved as of this writing |
| Sendchamp | `lib/sendchamp.js` | Current default. One field (`phone_number` in the `/verification/create` body) is based on evidence from Sendchamp's own Test SMS tool, not a fully confirmed field for that specific endpoint — check this first if sending fails with a phone-related validation error |

### Cron jobs

| Job | Where | Schedule |
|---|---|---|
| Payout batching | `app/api/payouts/run/route.js` | **Native Vercel cron** (`vercel.json`), daily 06:00 |
| Cold outreach | `app/api/cron/outreach/route.js` | External scheduler (cron-job.org), daily — Vercel's Hobby tier limits native cron jobs, so this and the two below deliberately don't use `vercel.json` |
| Wallet nudge | `app/api/cron/wallet-nudge/route.js` | External scheduler, daily |
| Expire stale leads | `app/api/cron/expire-stale-leads/route.js` | External scheduler, daily — **not yet actually configured on any scheduler**, needs to be added |

All cron routes check `CRON_SECRET` as a bearer token — set this in whatever external scheduler is used, matching
the header Vercel's own native cron sends automatically.

---

## The business model

Customers **always pay the business directly** for a sale — Commission is never in that payment path. Instead:

1. Every business pays a flat plan fee (**Small ₦0/mo · Medium ₦180,000/mo · Large ₦250,000/mo**).
2. Every business pre-funds a **campaign wallet** via Paystack.
3. Commission deducts from that wallet the moment a campaign produces a billable result, splitting the deduction
   between Commission's plan-based fee (Small 20% · Medium 15% · Large 10%) and the referring affiliate(s), across
   up to 3 tiers.

| | Lead | Sale |
|---|---|---|
| Billable moment | Customer completes the Intent Form (`status='qualified'`) | Business verifies a reported sale, or a Paystack charge/renewal succeeds for a referred purchase |
| What's charged | A flat `cost_per_qualified_lead_naira` set per campaign | The computed commission on the sale amount |

Both paths go through `fn_charge_wallet()` (atomic, row-locked — two simultaneous qualifications can never both
succeed against a balance that only covers one) and the same unchanged `lib/commissionEngine.js` either way.

### Worked example — a qualified lead

₦5,000 cost-per-lead, tiers 60% / 25% / 15%, Medium plan (15% platform fee):

- Tier 1: 60% = ₦3,000, minus 15% (₦450) = **₦2,550 paid out**
- Tier 2: 25% = ₦1,250, minus 15% (₦187.50) = **₦1,062.50 paid out**
- Tier 3: 15% = ₦750, minus 15% (₦112.50) = **₦637.50 paid out**
- Commission's revenue: ₦750 (15% of ₦5,000)
- Business's wallet debit: ₦5,000 total, one `fn_charge_wallet()` call

### Worked example — a ₦100,000 sale

Tiers 8% / 5% / 2% of the sale, Medium plan:

- Tier 1: 8% = ₦8,000, minus 15% = **₦6,800 paid out**
- Tier 2: 5% = ₦5,000, minus 15% = **₦4,250 paid out**
- Tier 3: 2% = ₦2,000, minus 15% = **₦1,700 paid out**
- Commission's revenue: ₦2,250
- Business's wallet debit: ₦15,000 (they already kept the other ₦85,000 directly from the customer)

Both scenarios are covered in `lib/commissionEngine.test.js`.

---

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in real keys, see below
npm run dev
```

Open `http://localhost:3000`. Run the commission engine's unit tests any time (no external services needed):

```bash
npm test
```

### 1. Supabase

1. Create a project at supabase.com.
2. Paste `supabase/schema.sql` into the SQL editor and run it, then run **every** `supabase/migration_*.sql` file
   too, in the order they were added — the schema alone is not the current state of the database.
3. In **Authentication → Providers**, enable Google and set your OAuth client ID/secret.
4. In **Authentication → URL Configuration**, add `http://localhost:3000/api/auth/callback` (and your production
   URL) as a redirect URL.
5. Copy your project URL and keys into `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` (server-only).

### 2. Paystack

1. Create a Paystack account, grab your test secret/public keys.
2. Set your webhook URL to `https://<your-domain>/api/paystack/webhook`.
3. Fill in `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_WEBHOOK_SECRET`.

### 3. SMS/OTP (Termii or Sendchamp)

Set `SMS_PROVIDER` to `termii` or `sendchamp`, plus that provider's own API key/sender ID (see `.env.example`).
See **SMS/OTP providers** above for the current status of each.

### 4. Email (Brevo)

Set `BREVO_API_KEY`. `lib/email.js` no-ops with a console log if it's not set, so this can be skipped for local
development.

### 5. Deploy

```bash
vercel
```

Add every environment variable from `.env.local` in the Vercel project settings, set your real domain as a custom
domain, and configure the external cron jobs (see **Cron jobs** above) on cron-job.org or similar.

---

## Known gaps, deliberately deferred

- **`products` → `campaigns` table/column rename.** The UI says "Campaign" everywhere now; the underlying table is
  still `products`. A real rename, touching many files — deferred as large and risky relative to its value.
- **The disabled-via-env-var feature** at the top of this file — not deferred by choice, blocked on external
  SMS provider activation.
- **WhatsApp as an OTP delivery channel** — templates were submitted to Meta but ran into WABA verification-tier
  requirements for the Authentication category specifically; a Marketing-category fallback template was explored
  as a workaround with real tradeoffs (cost, policy risk) that were never fully resolved.

## Tech stack

- **Frontend:** Next.js 14 (App Router), React 18, MUI 6
- **Backend:** Next.js Route Handlers, Supabase (Postgres + Auth)
- **Payments:** Paystack — wallet top-ups, affiliate payouts, and direct sale/subscription checkouts
- **Email:** Brevo
- **SMS/OTP:** Termii or Sendchamp, switchable via `lib/sms.js`
- **Hosting:** Vercel

## Brand

Primary color `#FFCB05`. Type: Space Grotesk (display) + Inter (body). Tokens live in `lib/theme.js`.
