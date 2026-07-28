# Commission (commission.ng)

Nigeria's affiliate marketplace — businesses list products and launch
multi-tier (up to 3 levels) affiliate programs; affiliates share unique
referral links and earn one-time or recurring commissions, paid out
automatically via Paystack.

This repo is a working MVP scaffold built directly from the Commission TRD.
It is **not yet deployed or connected to live services** — you'll need to
create your own Supabase project and Paystack account and drop the keys in.

---

## What's built

| Area | Where | Notes |
|---|---|---|
| Database schema | `supabase/schema.sql` | Unified `users` table, businesses, products, 3-tier `affiliate_programs` (DB trigger enforces the tier cap), referral clicks, transactions, commission ledger, payouts, RLS policies |
| Commission engine | `lib/commissionEngine.js` | Pure calculation module — tier lineage walk, per-tier commission + platform fee. **Unit tested**, run `npm test` |
| Paystack webhook | `app/api/paystack/webhook/route.js` | Verifies signature + transaction, identifies the referring affiliate, runs the commission engine, writes the commission ledger |
| Referral links | `app/r/[code]/route.js` | `commission.ng/r/ABC123` — tracks the click, sets an attribution cookie, redirects to checkout |
| Google Sign-In | `app/api/auth/callback/route.js`, `components/marketing/SignInModal.js` | Supabase Auth OAuth exchange, upserts into the unified `users` table |
| Marketing site | `app/page.js` + `components/marketing/*` | Single page, business/affiliate audience toggle (no separate URLs), minimal nav, smooth-scroll anchors |
| Dashboard | `app/dashboard/*` | Home, Discover, My Products (+ New Product/program form), My Promotions, Network, Transactions, Account — all mobile-responsive |

### What's intentionally stubbed for you to finish

- Dashboard pages read from `lib/sampleData.js` placeholders — each page has
  a comment showing the real Supabase query to swap in.
- Paystack subaccount/split configuration for business settlement (section 5
  of the TRD) — the `businesses.paystack_subaccount_code` column is there,
  but the actual subaccount-creation call isn't wired up yet.
- Payout batching (grouping multiple `commissions` rows into one `payouts`
  transfer) — the tables exist (`payouts`, `payout_commissions`) but there's
  no cron/job runner in this scaffold.
- Email notifications (Brevo/Resend), Sentry, GA4 — mentioned in the TRD as
  "introduce only where they add clear value"; not added yet.

---

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in real keys, see below
npm run dev
```

Open `http://localhost:3000`.

Run the commission engine's unit tests any time (no external services needed):

```bash
npm test
```

### 1. Supabase

1. Create a project at supabase.com.
2. Paste `supabase/schema.sql` into the SQL editor and run it.
3. In **Authentication → Providers**, enable Google and set your OAuth
   client ID/secret (from Google Cloud Console).
4. In **Authentication → URL Configuration**, add
   `http://localhost:3000/api/auth/callback` (and your production URL) as a
   redirect URL.
5. Copy your project URL and keys into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — never expose to the client)

### 2. Paystack

1. Create a Paystack account, grab your test secret/public keys.
2. In the Paystack dashboard, set your webhook URL to
   `https://<your-domain>/api/paystack/webhook`.
3. Fill in `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, and
   `PAYSTACK_WEBHOOK_SECRET` in `.env.local`.

### 3. Deploy

The stack is built for Vercel:

```bash
vercel
```

Add the same environment variables from `.env.local` in the Vercel project
settings, then set your real domain (commission.ng) as a custom domain.

---

## Tech stack

- **Frontend:** Next.js 14 (App Router), React 18, MUI 6
- **Backend:** Next.js Route Handlers, Supabase (Postgres + Auth)
- **Payments:** Paystack (checkout, webhooks, transfers)
- **Hosting:** Vercel

## Brand

Primary color `#FFCB05`. Type: Space Grotesk (display) + Inter (body).
Tokens live in `lib/theme.js`.

## The commission model, in one example

A ₦100,000 sale with an 8% / 5% / 2% three-tier program and a 15% platform
fee:

- Tier 1 affiliate earns 8% = ₦8,000, minus 15% platform fee (₦1,200) = **₦6,800 paid out**
- Tier 2 affiliate earns 5% = ₦5,000, minus 15% (₦750) = **₦4,250 paid out**
- Tier 3 affiliate earns 2% = ₦2,000, minus 15% (₦300) = **₦1,700 paid out**
- Business receives ₦100,000 − ₦15,000 = **₦85,000**
- Commission's revenue = ₦1,200 + ₦750 + ₦300 = **₦2,250** (from the affiliate commission, never from the sale)

This exact scenario is covered in `lib/commissionEngine.test.js`.
