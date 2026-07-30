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

### Also built (payments settlement, payouts, notifications)

| Area | Where | Notes |
|---|---|---|
| Business settlement | `app/api/paystack/subaccount/route.js`, `lib/paystack.js` (`createBusinessSubaccount`) | Creates a Paystack subaccount per business; `initializeTransaction` routes sale proceeds there via `subaccount` + `bearer_type` so Commission's account is never a pass-through for the full sale |
| Bank verification | `app/api/paystack/banks/route.js`, `resolveAccountNumber` in `lib/paystack.js` | Powers the bank dropdown + account-name confirmation in the Account page |
| Affiliate payout recipients | `app/api/paystack/recipient/route.js` | Registers a Paystack transfer recipient and stores it on the `users` row |
| Payout batching | `app/api/payouts/run/route.js`, `vercel.json` | Daily cron (06:00). Groups pending `commissions` by `(affiliate, program)`, checks each program's `min_payout_naira` threshold, then batches qualifying rows into one Paystack transfer per affiliate |
| Email notifications | `lib/email.js` (Resend) | Commission-earned email (on webhook), payout-initiated (on batch run), payout-paid (on `transfer.success` webhook). No-ops with a console log if `RESEND_API_KEY` isn't set |
| Account page | `app/dashboard/account/page.js` | Working forms — pick a bank, enter an account number, and it verifies + registers with Paystack (both the affiliate payout side and the business settlement side) |

Protect `/api/payouts/run` with `CRON_SECRET` (see `.env.example`) so it can't
be triggered by anyone who finds the URL — Vercel Cron sends this
automatically once configured in Project Settings → Cron Jobs.

### What's still intentionally left for you to finish

- Dashboard pages read from `lib/sampleData.js` placeholders — each page has
  a comment showing the real Supabase query to swap in.
- The checkout flow itself (a page that calls `initializeTransaction` and
  redirects to Paystack's hosted checkout) — the referral redirect
  (`app/r/[code]`) currently lands on the business's own `product_url`
  rather than a Commission-hosted checkout page.
- Sentry error monitoring and GA4 analytics — mentioned in the TRD as
  "introduce only where they add clear value"; not added yet.
- Business subscription billing (Free/Pro/Plus plans) — the `businesses.plan`
  column exists but there's no billing flow charging the business itself.

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

## Physical vs Digital products

Every product now declares a **Product Type** at creation time, and it drives everything downstream — payment flow, fee model, and which form fields even show up.

|  | Physical | Digital |
|---|---|---|
| Examples | Electronics, furniture, cars, real estate, fashion, beauty, home appliances | SaaS, HR software, HMO, insurance, ISPs, online courses, memberships, software licenses |
| Payment flow | Customer pays the **business directly** — Commission never touches the money | Customer pays **Commission via Paystack**, which auto-splits funds |
| How a sale is recorded | Business **manually reports** it (`POST /api/sales/report`), then **confirms** it (`POST /api/sales/[id]/verify`) — matching "Business confirms sale" in the flow | Automatic, via the Paystack webhook (`app/api/paystack/webhook`) |
| Commission's revenue | **Subscription only** — platform fee is always 0% | Subscription **+** the plan-based platform fee (Free 20% / Pro 15% / Plus 10%) |
| Who pays the affiliate | The business (`business_pays_directly`), or Commission if the business opts into `commission_facilitates` (`businesses.physical_payout_mode`) | Commission, automatically, via the payout batching cron |
| Recurring commission | Not applicable — always one-time | Supported |

**Where this lives in code:**
- `lib/categories.js` — the category taxonomy is now tagged `productType: 'physical' | 'digital'`, feeding `categoriesForType()` so the product form only shows relevant categories
- `lib/pricingPlans.js` — `feePercentForPlan(plan, productType)` now takes product type as a second argument and **always returns 0 for physical**, regardless of plan
- `app/dashboard/products/new/page.js` — Product Type is the first choice on the form; the rest of the fields (billing frequency, recurring-commission toggle, purchase URL vs. offline payment instructions) adapt based on it
- `app/dashboard/products/page.js` — Physical/Digital filter tabs with type badges
- `app/api/sales/report/route.js` + `app/api/sales/[transactionId]/verify/route.js` — the manual sale-reporting flow physical products use instead of a webhook
- `app/api/paystack/webhook/route.js` — now guards against ever charging a platform fee on a physical product (and logs loudly if a physical product's charge somehow reaches it — that should never happen, since physical checkout links point at the business's own site/WhatsApp/store, never a Commission-hosted Paystack checkout)
- `supabase/schema.sql` — `products.product_type` (`physical`/`digital`), `businesses.physical_payout_mode`, and new manual-sale-reporting columns on `transactions` (`source`, `verification_status`, `proof_url`, `reported_by`); `commissions.payout_status` gained a `business_handles` value for the case where the business pays the affiliate directly and Commission's ledger just reflects that it happened



## Recent changes

1. **Physical vs Digital product types.** See the section above.
2. **Plan-based platform fee.** Commission's cut of the affiliate commission
   now depends on the business's plan — Free 20%, Pro 15%, Plus 10% — see
   `lib/pricingPlans.js` (`feePercentForPlan`). The Paystack webhook looks up
   the business's `plan` at charge time and overrides whatever's stored on
   `affiliate_programs.platform_fee_percent`, so upgrading a plan takes
   effect on the very next sale with no data migration needed. Tested in
   `lib/pricingPlans.test.js`.
2. **Pricing table.** `components/marketing/Pricing.js`, shown on the
   business landing page under a new "Pricing" nav link.
3. **Programmatic SEO framework** for hundreds of thousands of product
   pages — see the dedicated section below.
4. **Space Grotesk everywhere.** `lib/theme.js` now sets it as the base
   `fontFamily` for all typography (body included, not just headings);
   `app/globals.css` loads weights 400–700.
5. **Two distinct "how one sale splits" visuals** instead of one shared
   static diagram:
   - `components/marketing/BusinessSettlementVisual.js` — an interactive
     Free/Pro/Plus toggle showing how the platform-fee split changes while
     the business's own proceeds stay fixed (their fee always comes out of
     the affiliate commission, never the sale).
   - `components/marketing/AffiliateEarningsVisual.js` — an animated bar
     chart showing a recurring commission compounding month over month,
     since the whole point of a recurring commission is that it keeps
     growing — motion communicates that better than a static split.
6. **More whitespace at the page edges.** `lib/theme.js` adds responsive
   `MuiContainer` padding (24px mobile → 80px desktop); the dashboard shell
   and marketing navbar (which don't use `Container`) got matching padding
   bumps directly.

## Programmatic SEO framework

Built to scale to hundreds of thousands of product pages without paying for
that scale at build time or sitemap-request time.

**Routes** (all Server Components, ISR via `export const revalidate = 3600`):
- `app/products/[businessSlug]/[productSlug]/page.js` — one page per
  affiliate program. This is the high-volume surface. `generateStaticParams`
  returns `[]` (nothing pre-rendered at build — impossible at this scale);
  `dynamicParams` stays at its Next.js default of `true`, so any slug pair
  renders on first request and is cached for an hour after.
- `app/businesses/[slug]/page.js` — one page per business, listing its
  active programs.
- `app/categories/[category]/page.js` — category hub pages (e.g. "HR
  Software affiliate programs in Nigeria"), paginated 24/page. All 6
  categories' first pages *are* pre-rendered at build (cheap, fixed count);
  deeper pages render on demand.

All three pull their copy/JSON-LD from `lib/seo.js`, and categories come
from the single shared list in `lib/categories.js` (also used by the
product-creation form) so a category slug can never drift out of sync with
what's actually stored in the database.

**Sitemap** (the part that has to handle six-figure URL counts):
- `app/sitemap.js` uses Next's `generateSitemaps()` to fan out into
  multiple 45,000-URL chunks (`/sitemap/0.xml`, `/sitemap/1.xml`, …) instead
  of one file hitting the sitemap spec's 50k-URL cap. The last chunk holds
  every lower-volume URL type (marketing pages, businesses, category hubs).
- `app/sitemap-index.xml/route.js` — Next doesn't auto-publish an index of
  those chunk files, so this route builds one. **This is the single URL to
  submit to Google Search Console / Bing Webmaster Tools.**
- `app/robots.js` points crawlers at that index and blocks `/dashboard` and
  `/api`.

**Fast indexing without waiting on the hourly ISR window:**
`app/api/revalidate/route.js` — call this right after a product/business is
created or updated (protected by `REVALIDATE_SECRET`) to bust the cache on
its page, its business page, and its category hub immediately. The
in-app product form currently inserts client-side via Supabase; the README
comment in `app/dashboard/products/new/page.js` flags that this insert
should move to a server Route Handler in production so it can call
`revalidatePath()` in-process, rather than needing to expose the
revalidate secret to the browser.

## Company & industry keyword-target pages

The two instances from the original ask — `/gtbank-affiliate-program` (company) and
`/fintech-affiliate-programs` (industry) — both route through a single catch-all:

- `app/[slug]/page.js` — parses the slug suffix (`-affiliate-program` = company,
  `-affiliate-programs` = industry) via `parseSeoRouteSlug()` in `lib/seo.js`,
  then looks up a matching row in `seo_keyword_targets`
- **Deliberately does not auto-generate a page for an arbitrary slug.** Only
  slugs seeded in `seo_keyword_targets` render — everything else 404s. This
  is on purpose: generating a page per arbitrary string is the "doorway page"
  pattern search engines penalize, and for a real company name it would mean
  asserting something ("X has an affiliate program") Commission can't verify
- Company pages ask the question honestly — "Does GTBank have an affiliate
  program?" — rather than claiming one exists, with a "notify me" email
  capture (`components/marketing/NotifyMeForm.js` → `app/api/seo-targets/notify`)
  and links to real live programs in a related category
- Once a real business matching that identity actually joins Commission, set
  `seo_keyword_targets.claimed_business_slug` and the page permanently
  301-redirects to the real `/businesses/[slug]` page instead
- Seed starter data: `supabase/seed_seo_targets.sql` — a handful of
  illustrative rows. Expand this deliberately, company by company, industry
  by industry — don't bulk-import a scraped list without reviewing each one
- These URLs are included in the sitemap (`app/sitemap.js`'s static chunk)
  automatically, and drop out of it once claimed (no point indexing a
  placeholder for a page that now redirects)

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
