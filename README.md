# Commission (commission.ng)

A performance-based customer acquisition platform for businesses of every size and industry in Nigeria —
businesses list a product or service and set what a qualified lead or sale is worth to them; affiliates share a
unique referral link and earn one-time or recurring commissions, up to 3 tiers deep, paid out automatically via
Paystack.

This repo is a working MVP scaffold built directly from the Commission TRD.
It is **not yet deployed or connected to live services** — you will need to
create your own Supabase project and Paystack account and drop the keys in.

---

## What is built

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
| Email notifications | `lib/email.js` (Resend) | Commission-earned email (on webhook), payout-initiated (on batch run), payout-paid (on `transfer.success` webhook). No-ops with a console log if `RESEND_API_KEY` is not set |
| Account page | `app/dashboard/account/page.js` | Working forms — pick a bank, enter an account number, and it verifies + registers with Paystack (both the affiliate payout side and the business settlement side) |

Protect `/api/payouts/run` with `CRON_SECRET` (see `.env.example`) so it cannot
be triggered by anyone who finds the URL — Vercel Cron sends this
automatically once configured in Project Settings → Cron Jobs.

### What is still intentionally left for you to finish

- Dashboard pages read from `lib/sampleData.js` placeholders — each page has
  a comment showing the real Supabase query to swap in.
- The checkout flow itself (a page that calls `initializeTransaction` and
  redirects to Paystack's hosted checkout) — the referral redirect
  (`app/r/[code]`) currently lands on the business's own `product_url`
  rather than a Commission-hosted checkout page.
- Sentry error monitoring and GA4 analytics — mentioned in the TRD as
  "introduce only where they add clear value"; not added yet.
- Business subscription billing (Small/Medium/Large plans) — the `businesses.plan`
  column exists but there is no billing flow charging the business itself.

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

## The business model

Customers **always pay the business directly** — Commission is never in that
payment path for any product, physical or digital. Commission is a tech
company, not a payment processor. Instead:

1. Every business pays a flat monthly subscription (**Small ₦25k / Medium
   ₦50k / Large ₦75k**) regardless of what they sell.
2. Every business pre-funds a **campaign wallet** via Paystack (`businesses.wallet_balance_naira`).
3. Commission automatically deducts from that wallet the moment a **campaign**
   (an `affiliate_programs` row) produces a billable result, and splits the
   deduction between Commission's plan-based fee (Small 20% / Medium 15% /
   Large 10%) and the referring affiliate(s), across up to 3 tiers.

What counts as "a billable result" is the campaign's **conversion goal**
(`affiliate_programs.conversion_goal`):

| | Lead | Sale |
|---|---|---|
| Flow | Visitor → Campaign Page → Short Form → Lead → unique WhatsApp link → business chats with them → Long Form → **Qualified** (billable) | Customer buys directly from the business → business **reports** the sale → business **confirms/verifies** it (billable) |
| What is charged | A flat `cost_per_qualified_lead_naira` set per campaign (e.g. ₦5,000) | The computed commission total on the sale amount (e.g. 15% of a ₦100k sale) |
| Where it is built | `app/api/leads/capture` (Short Form) + `app/api/leads/[id]/qualify` (the billable moment) + `app/dashboard/leads` (where a business actually reviews and qualifies) | `app/api/sales/report` + `app/api/sales/[id]/verify` (the billable moment) |
| Tier percentages mean | Each tier's share of the **whole lead fee** (should sum to 100%) | Each tier's share of the **sale amount**, same as a traditional affiliate commission |

Both paths funnel into the same mechanism: `fn_charge_wallet()` (a Postgres
function in `supabase/schema.sql`) atomically debits the wallet — with row
locking, so two simultaneous qualifications can never both succeed against a
balance that only covers one — and if the balance cannot cover it, nothing is
charged and the lead/sale stays unqualified/unverified so it can be retried
once the business tops up. Both paths also reuse the exact same
**`lib/commissionEngine.js` unchanged** — a lead's flat fee and a sale's
computed total are just `amountNaira` to the engine, tier splitting and
plan-based fee math work identically either way.

**Where the wallet itself lives in code:**
- `supabase/schema.sql` — `businesses.wallet_balance_naira`, the
  `wallet_transactions` ledger table, `fn_charge_wallet()`
- `lib/wallet.js` — the server-side `chargeWallet()` wrapper (never touch
  `wallet_balance_naira` directly from app code — always go through this)
- `app/api/wallet/topup/route.js` + `lib/paystack.js`'s
  `initializeWalletTopup()` — how a business actually adds funds
- `app/api/paystack/webhook/route.js` — now only handles two things:
  crediting a wallet on a successful top-up, and updating an affiliate
  payout's status. It used to calculate commissions off a live customer
  charge; that logic has moved into the qualify/verify routes above,
  triggered by a business action instead of a payment event
- `app/dashboard/account/page.js` — the wallet balance card + top-up form

**Physical vs Digital (`products.product_type`) still exists**, but it is now
purely a *category* distinction (electronics vs. SaaS, for the taxonomy in
`lib/categories.js`) — it no longer affects payment flow or fee calculation
the way it used to. That is a deliberate simplification: earlier iterations
of this schema had physical products paying a 0% platform fee because a
physical sale could not be independently verified. The wallet model does not
have that problem — verification is the business's own confirmation either
way — so the fee is now uniform, gated only by conversion goal (both leads
and sales are billable) and plan (which determines the percentage).

## Recent changes

0. **Dedicated Google auth pages, real dashboard gating, and the real logo
   everywhere**:
   - **`/signin` and `/signup`** — a real split-screen auth page
     (`components/marketing/AuthPage.js`), Google-only, no email/password.
     The right panel content differs by mode - real product stats for
     signup, "what's waiting for you" framing for signin.
   - **The dashboard was previously unprotected** — `/dashboard` had no auth
     check of any kind. Added `middleware.js`, which now redirects an
     unauthenticated visitor to `/signin`, and an authenticated-but-not-yet-
     granted-access user to `/welcome`.
   - **`users.access_granted`** (new column, defaults `false`) is
     the single source of truth for who can actually reach the dashboard.
     Granting it today is a manual database update — there is no admin UI
     for it yet.
   - **The OAuth callback (`app/api/auth/callback`) decides the final
     redirect itself**, based on that flag, regardless of what `next` was
     requested. This is what makes it safe for `/signin`, `/signup`, and
     every "request an account" CTA on the site to all share the exact same
     code path — nobody can request their way past the gate by editing a
     query string.
   - **There is no manual form anywhere anymore.** `RequestAccountForm.js`
     was rewritten to drop the name/email/phone fields and submit button
     entirely — every CTA on the site now triggers Google auth directly
     (`lib/googleAuth.js`), which registers a real account but (per
     `access_granted` defaulting false) lands on `/welcome`, not
     the dashboard, same as everyone else pre-launch. The old
     `waitlist_requests` table and its API route were removed as a result —
     `users.intended_role` and `users.signup_source_page` now capture what
     that table used to.
   - **`/welcome`** shows a personalized "Hi, {first name}!" (read from the
     Google profile server-side) with review-status messaging and a CTA
     back to the homepage.
   - **The old `SignInModal.js`** was already unreachable (nothing called
     it since an earlier pass removed every button that opened it) —
     removed entirely along with its dead wiring, superseded by the pages
     above.
   - **Real logo (`/circle.svg`) everywhere** the placeholder "C" badge
     used to be — dashboard sidebar, footer, the new auth pages.
   - **README reframed** as a performance-based customer acquisition
     platform for businesses of every size and industry, not just
     "Nigeria's affiliate marketplace."

0. **Layout, performance, and content fixes from side-by-side comparison
   with a reference site**:
   - **Fixed misaligned left/right margins.** Every page-content component
     was using a different `Container maxWidth` (`sm`, `md`, `lg` mixed
     across 9 different components) than the footer and internal-links
     section, so the left edge of a page's headline never lined up with the
     left edge of its own footer. All standardized to `lg`.
   - **Removed the navbar's border line**, made the logo a real link to
     `/`, and changed its CTA from "Sign in" to "Get started" to match the
     rest of the site's early-access framing.
   - **Fixed slow internal-link clicks** — the Programs column was running
     a fresh, uncached Supabase query on every single page navigation
     (`lib/programs.js`'s `listPrograms`), since it renders inside the
     footer on every marketing page. Now wrapped in `unstable_cache` with a
     1-hour revalidate window.
   - **Every internal-link column title is now a real link** to its parent
     index page — including a brand new `/corporate` hub, which is what was
     actually missing for Comparison/Corporate (Comparison already had
     `/comparisons`; Corporate had no equivalent at all).
   - **Smaller font sizes** across the internal-links section and footer.
   - **Rebuilt the footer to match the sketch**: centered logo → centered
     CTA card → centered copyright, instead of the previous
     asymmetric/left-aligned arrangement.
   - **Removed the redundant CTA buttons** from every page that already has
     the `RequestAccountForm` lead magnet — `TwoAudienceCta` no longer
     doubles up with it anywhere.
   - **Reused real, existing site components instead of leaving new pages
     thin**: `/features` now embeds the actual `Pricing` component (Custom
     Branding and API access are plan-gated, so it belongs there),
     `/solutions` embeds the real DIY-vs-Commission `Comparison` table, and
     `/campaigns` embeds the real `SavingsCalculator`.

0. **Unique layouts, real content everywhere, bare comparison URLs, naira-amount sliders**:
   - **Six genuinely distinct page layouts** replace the one generic template
     that used to serve Conversions, Locations, Campaigns, Features,
     Solutions, and Integrations — numbered process steps
     (`ConversionPageContent`), hero city name with a dot-list
     (`LocationPageContent`), a spec-sheet definition list
     (`CampaignPageContent`), an icon-led checklist (`FeaturePageContent`),
     a problem→solution→outcome 3-stage flow (`SolutionPageContent`), and a
     Native/Via-API badge header with a dark content box
     (`IntegrationPageContent`). Industries, Comparisons, and Programs keep
     their own already-distinct templates.
   - **Every one of the 12 internal-link columns now has 6 real items**,
     each backed by an actual page — Conversions, Locations, Campaigns,
     Features, and Solutions were padded with genuinely useful new content
     rather than filler; Corporate got 3 real new pages (`/terms`,
     `/privacy`, `/security`) instead of being left at 3.
   - **Comparisons moved to bare root URLs** (`/google-ads`, not
     `/comparisons/commission-and-google-ads`) — `app/[slug]/page.js` now
     renders them directly; old links still 301 to the new URL.
   - **Integrations rewritten**: WhatsApp and Email are now explicitly
     native; API access is framed as the premium (Medium/Large-plan)
     mechanism for routing leads anywhere, with Freshsales/Zoho CRM/Supabase
     honestly described as possible *through* the API rather than
     dedicated connectors. `lib/pricingPlans.js` now lists API access and
     custom branding as explicit Medium/Large-plan features.
   - **Internal-link columns reordered by SEO priority**, not the sketch's
     literal left-to-right order — reasoning documented directly in
     `lib/internalLinks.js`.
   - **Calculator sliders now drag a real naira amount** — business up to
     ₦10,000,000 (monthly budget), affiliate up to ₦1,000,000 (referral
     value/month) — instead of an abstract lead/referral count.
   - **Index pages cross-reference related sections** via a new
     `relatedLinks` prop on `SectionIndexContent`.

0. **The six placeholder internal-link categories are now real pages**:
   Conversions, Locations, Campaigns, Features, Solutions, and Integrations
   all previously pointed at the closest existing page instead of their own
   — that's fixed. Each is now a real `index + [slug]` route pair
   (`app/conversions`, `app/locations`, `app/campaigns`, `app/features`,
   `app/solutions`, `app/integrations`), built on one shared template
   (`components/marketing/SectionPageContent.js` +
   `components/marketing/SectionIndexContent.js`) with content in
   `lib/siteSections.js`. All 12 internal-link columns now link to real
   pages, `app/sitemap.js` includes all of them, and `lib/internalLinks.js`
   was corrected against the actual sketch photo (previous version had a
   couple of transcription guesses that turned out wrong — see the
   Integrations copy in particular, which is now honest that Freshsales,
   Zoho CRM, and Supabase work via the generic lead webhook rather than a
   dedicated native connector — only WhatsApp is actually built into the
   product itself).

0. **Direct-sale checkout — the gap flagged last turn, now closed**:
   - **Two genuinely different payment mechanisms now, chosen per campaign's
     `conversion_goal`:**
     - `lead` — unchanged: no live payment, the business pre-funds a
       Campaign Wallet, a qualified lead deducts from it (`lib/wallet.js`,
       `lib/leadQualification.js`).
     - `sale` — **new**: the customer pays **Commission directly** at a
       Commission-hosted checkout (`lib/checkout.js`, triggered from
       `app/r/[code]`). Paystack **splits that single payment
       automatically** — the business's own proceeds route straight to
       their Paystack subaccount (`businesses.paystack_subaccount_code`,
       connected via `app/api/paystack/subaccount` + the new "Business
       settlement account" form in `app/dashboard/account`), while the
       total affiliate commission stays with Commission's main account.
       `app/api/paystack/webhook`'s new `handleDirectSaleSuccess` then just
       does bookkeeping — records the sale, creates the per-tier commission
       ledger rows — and the normal payout batch job transfers each
       affiliate their share while Commission keeps the platform-fee
       remainder.
   - No wallet involvement at all in the sale-goal path — the split happens
     at the payment processor, not in Commission's own ledger.
   - If a business has not connected a settlement account yet, a referral
     link for their sale-goal campaign falls back to the product page
     instead of a broken checkout.
   - `app/api/sales/report` + `app/api/sales/[id]/verify` (the older
     self-report-and-confirm mechanism) still exist as an explicit fallback
     for a sale that happened off Commission's checkout entirely, but are no
     longer the primary sale-goal mechanism.

0. **Pre-launch conversion model, nested page structure, and terminology
   rename** (latest):
   - **Never says "waitlist."** Every CTA (`lib/ctaVariants.js`) and the new
     lead-magnet form (`components/marketing/RequestAccountForm.js`) frame
     this as requesting early account access instead — backed by a new
     `waitlist_requests` table (internal name only) and
     `app/api/waitlist/join`.
   - **Every industry, program, and comparison page now embeds that lead
     form** — first name, email, phone, with a business/affiliate toggle.
   - **"Affiliate program" renamed to "program"** throughout the former
     keyword-target pages (`components/marketing/ProgramPageContent.js`).
   - **Nested routing, not a flat catch-all**: `/industries` (index) +
     `/industries/[slug]`, `/comparisons` (index) + `/comparisons/[slug]`,
     `/programs` (index) + `/programs/[slug]`. The old flat
     `app/[slug]/page.js` is now a thin 301-redirect shim from the previous
     URL pattern to its new nested home, so nothing already shared or
     indexed breaks.
   - **Minimum 10% commission for direct-sale campaigns** — enforced both
     client-side (`app/dashboard/products/new`) and at the database level
     (`chk_min_sale_commission` in `supabase/schema.sql`).
   - **Per-industry pay-per-qualified-lead defaults**
     (`lib/industryPages.js`) — ₦1,000 base (`DEFAULT_PPQL_NAIRA`), varying
     per industry (real estate ₦5,000 down to logistics ₦1,200), shown on
     each industry page.
   - **Internal-links section above the footer** (`lib/internalLinks.js` +
     `components/marketing/InternalLinksSection.js`) — priority-ordered
     columns (Programs, Industries, Comparisons, Businesses, Affiliates,
     Corporate), capped at 6 links per column with a deterministic weekly
     rotation, hidden below the `md` breakpoint (the footer itself still
     shows on mobile).
   - **Floating go-to-top button** (`components/marketing/GoToTopButton.js`)
     on every marketing page via the new shared
     `components/marketing/MarketingPageShell.js` wrapper.
   - **Homepage hero calculator** (`components/marketing/SavingsCalculator.js`)
     replaces the two static visuals with a single slider-driven
     savings/earnings estimator, swapping its framing by audience.
   - New minimal `/about`, `/contact`, `/careers` pages exist purely so the
     internal-links section has somewhere real to point.

   **Not yet done, flagged explicitly**: the requested change to how a
   direct-sale campaign is actually paid for — customers paying Commission
   directly, with the payment split between Commission and affiliates in
   real time — is a genuinely separate, large piece of work from the
   current wallet-charge model and has not been built.

0. **Campaign Wallet model + no-PII leads + comparison/industry pages** (latest pivot):
   - Customers now always pay the business directly - Commission is never in
     that payment path for either product type. Instead a business prepays
     a **Campaign Wallet**, and every qualified lead or verified sale
     deducts its commission straight from that balance.
   - **The platform fee moved to top-up time.** Small/Medium/Large take
     20%/15%/10% off the top the moment a business funds their wallet (see
     `app/api/paystack/webhook`) - not per lead, not per sale. A qualified
     lead or verified sale afterward pays affiliates their full commission
     with nothing further skimmed (`app/api/leads/[leadId]/qualify`,
     `app/api/leads/continue`, `app/api/sales/[transactionId]/verify` all
     run the commission engine at 0% platform fee now).
   - **Leads are never stored in Commission's database.** The `leads` table
     holds only an attribution/billing event (status, timestamps, charge
     amount, a `whatsapp_ref` token) - no name/phone/email/answers. The
     Short Form step needs no forwarding at all (the WhatsApp deep link
     itself carries the name to the business). The Long Form step
     (`app/api/leads/continue`, the piece that was missing before) forwards
     full details straight to the business's email or webhook
     (`lib/leadForwarding.js`) and never writes them down. Commission owns
     the affiliates; each business owns their leads.
   - **The full funnel is now built**: Campaign Page (Short Form,
     `components/marketing/LeadShortForm.js`) → unique WhatsApp link → public
     Long Form (`app/leads/[whatsappRef]/continue`) → Thank You page → wallet
     charged, affiliates paid.
   - **Plan-gated campaign branding** (`lib/branding.js`) - Small gets
     Commission's own look, Medium can add a logo, Large can add a logo and
     brand color on the two hosted campaign pages.
   - **New pSEO surfaces**: `/commission-and-[channel]` comparison pages
     (`lib/comparisons.js`) and bare-slug industry persuasion pages like
     `/real-estate` (`lib/industryPages.js`), both served through the same
     `app/[slug]` catch-all as the existing company/industry keyword-target
     pages. Every one of these ends with two CTA buttons - one for
     businesses, one for affiliates - with wording that varies per page
     (`lib/ctaVariants.js`) rather than repeating the same two phrases
     everywhere.


1. **The wallet-based business model.** See the section above — this is the
   biggest architectural change in the project so far.
2. **Plan-based platform fee**, now uniform regardless of product type or
   conversion goal — see `lib/pricingPlans.js` (`feePercentForPlan`), tested
   in `lib/pricingPlans.test.js`.
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
     Small/Medium/Large toggle showing how the platform-fee split changes while
     the business's own proceeds stay fixed (their fee always comes out of
     the affiliate commission, never the sale).
   - `components/marketing/AffiliateEarningsVisual.js` — an animated bar
     chart showing a recurring commission compounding month over month,
     since the whole point of a recurring commission is that it keeps
     growing — motion communicates that better than a static split.
6. **More whitespace at the page edges.** `lib/theme.js` adds responsive
   `MuiContainer` padding (24px mobile → 80px desktop); the dashboard shell
   and marketing navbar (which do not use `Container`) got matching padding
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
what is actually stored in the database.

**Sitemap** (the part that has to handle six-figure URL counts):
- `app/sitemap.js` uses Next's `generateSitemaps()` to fan out into
  multiple 45,000-URL chunks (`/sitemap/0.xml`, `/sitemap/1.xml`, …) instead
  of one file hitting the sitemap spec's 50k-URL cap. The last chunk holds
  every lower-volume URL type (marketing pages, businesses, category hubs).
- `app/sitemap-index.xml/route.js` — Next does not auto-publish an index of
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
  asserting something ("X has an affiliate program") Commission cannot verify
- Company pages ask the question honestly — "Does GTBank have an affiliate
  program?" — rather than claiming one exists, with a "notify me" email
  capture (`components/marketing/NotifyMeForm.js` → `app/api/seo-targets/notify`)
  and links to real live programs in a related category
- Once a real business matching that identity actually joins Commission, set
  `seo_keyword_targets.claimed_business_slug` and the page permanently
  301-redirects to the real `/businesses/[slug]` page instead
- Seed starter data: `supabase/seed_seo_targets.sql` — a handful of
  illustrative rows. Expand this deliberately, company by company, industry
  by industry — do not bulk-import a scraped list without reviewing each one
- These URLs are included in the sitemap (`app/sitemap.js`'s static chunk)
  automatically, and drop out of it once claimed (no point indexing a
  placeholder for a page that now redirects)

## Tech stack

- **Frontend:** Next.js 14 (App Router), React 18, MUI 6
- **Backend:** Next.js Route Handlers, Supabase (Postgres + Auth)
- **Payments:** Paystack — but only for two things now: a business topping up
  their campaign wallet, and Commission paying affiliates out. Customers
  never pay through Paystack via Commission at all.
- **Hosting:** Vercel

## Brand

Primary color `#FFCB05`. Type: Space Grotesk (display) + Inter (body).
Tokens live in `lib/theme.js`.

## The commission model, in two worked examples

**A qualified lead**, ₦5,000 cost-per-lead, tiers 60% / 25% / 15% (summing
to 100 — the whole fee), Medium plan (15% platform fee):

- Tier 1 affiliate earns 60% = ₦3,000, minus 15% (₦450) = **₦2,550 paid out**
- Tier 2 affiliate earns 25% = ₦1,250, minus 15% (₦187.50) = **₦1,062.50 paid out**
- Tier 3 affiliate earns 15% = ₦750, minus 15% (₦112.50) = **₦637.50 paid out**
- Commission's revenue = ₦450 + ₦187.50 + ₦112.50 = **₦750** (15% of the ₦5,000, deducted from the business's wallet the moment the lead is marked qualified)
- The business's total wallet debit for this one lead = **₦5,000** — Commission's cut plus every tier's payout, all in one `fn_charge_wallet()` call

**A ₦100,000 self-reported sale**, tiers 8% / 5% / 2% (of the sale), Medium plan:

- Tier 1 affiliate earns 8% = ₦8,000, minus 15% (₦1,200) = **₦6,800 paid out**
- Tier 2 affiliate earns 5% = ₦5,000, minus 15% (₦750) = **₦4,250 paid out**
- Tier 3 affiliate earns 2% = ₦2,000, minus 15% (₦300) = **₦1,700 paid out**
- Commission's revenue = ₦1,200 + ₦750 + ₦300 = **₦2,250**
- The business's wallet is debited **₦15,000** total (the full commission pool) once they verify the sale — they already kept the other ₦85,000 themselves, having been paid directly by the customer

Both scenarios are covered in `lib/commissionEngine.test.js` (the engine
itself does not know or care whether `amountNaira` came from a lead fee or a
sale — that distinction lives one layer up, in the qualify/verify routes).

