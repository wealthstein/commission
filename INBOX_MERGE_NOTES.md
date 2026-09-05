# Inbox — merge notes

WhatsApp team inbox + lightweight CRM, merged into Commission at `/dashboard/inbox`, with matching marketing
pages, pricing, a restored team-management system, and single-session-per-account enforcement.

## Repo layout
```
commission/          (repo root — app/, components/, lib/, etc. live directly here, no subfolder wrapper)
├── app/
├── components/
├── content/
├── lib/
├── public/
├── supabase/
├── worker/            Separate always-on Node service holding the WhatsApp (Baileys) connection
└── INBOX_MERGE_NOTES.md
```

## Database migrations — run in this exact order
1. `supabase/schema.sql`
2. Every other pre-existing `supabase/migration_*.sql` file **except** `migration_inbox.sql` and `migration_rename_core_tables.sql`
3. `supabase/migration_rename_products_to_campaigns.sql` — confirmed **not yet applied** to the live database (the live table is still literally `products`, not `campaigns`) despite looking historical in the repo. Must run before the core rename below; wrapped in `begin;`/`commit;` for this actual run.
4. `supabase/migration_inbox.sql`
5. `supabase/migration_rename_core_tables.sql` — renames every table to a domain-prefixed name (`core_`, `affiliate_`, `billing_`, `growth_`, `inbox_`) via `ALTER TABLE RENAME` (preserves all data/FKs), and redefines every function/policy whose body referenced a renamed table by text (Postgres doesn't auto-rewrite `language plpgsql` bodies on rename). Includes 3 tables with no `CREATE TABLE` anywhere in this repo's migration history (`seo_keyword_targets`, `waitlist_requests`, `notify_requests` — created directly via the Supabase dashboard, evidently) — their app code already queried `growth_`-prefixed names before this migration existed, so those two routes were broken against the live database until this runs. `migration_rename_core_tables_ROLLBACK.sql` sits alongside it if you need to reverse quickly — take a real backup before running the forward migration regardless.
6. `supabase/migration_single_session.sql` — adds single-active-session support (see below).
7. `supabase/migration_inbox_history_sync.sql` — fixes the conversation-rollup trigger for safe bulk historical inserts (see below). Order relative to step 6 doesn't matter; both are independent of each other.

**This is not a zero-downtime cutover.** Deploy the updated app code first (it'll briefly error on DB calls), then run the rename migrations immediately after.

## What's built

**Inbox core** — `app/dashboard/inbox/**`: Chats, Pipeline, Leads, Tasks, Inventory, Insights, Connections. Tables are `inbox_`-prefixed, hang off `core_businesses`/`core_users`/`core_business_team_members`.

**Team management — restored.** `/api/team/invite`, `/api/team/accept`, `/api/team/[memberId]` were stubbed to always `403`. Real logic is back, reusing `lib/email.js`'s existing templates. New "Team" tab on the Account page. Also fixed: the Account page only ever resolved a business via `owner_id`, so a team member accepting an invite saw a blank page.

**Marketing** — `/inbox` page, navbar link, and a business-audience homepage section, sharing `components/marketing/WhatsAppComparisonSection.js`. Claims use real industry figures, not literal "99.99%" — deliberately honest that SMS matches WhatsApp on raw open rates.

**Pricing** — `content/pricingPlans.json`: Small has **no Inbox access at all** (0 numbers, 0 seats — paid-plan-exclusive feature), Medium gets 2 WhatsApp numbers / 4 team seats, Large gets 3 / 8. Enforced, not just copy — `lib/inboxPlanLimits.js` is the single source of truth, checked in `/api/inbox/connections/create` and `/api/team/invite` (seat limit is shared platform-wide, not Inbox-specific — a Small-plan business currently can't add teammates for anything, not just Inbox).

**Push notifications (site-wide PWA)** — `next-pwa` InjectManifest, `public/manifest.json`, `pwa/custom-sw.js`. Site-wide by explicit choice — every marketing page gets the service worker, not just the dashboard.

**Single active session per account.** `migration_single_session.sql` adds `core_users.active_session_token`. Every login (`app/api/auth/callback`) overwrites it and sets the same value as an httpOnly cookie (`commission_session_token`); `middleware.js` compares the two on every `/dashboard/*` request and signs out whichever session holds a stale value — logging in on a second device kicks the first one out the next time it makes a request, with a message shown on `/signin` explaining why. Deliberately not enforced when the DB value is null, so this doesn't mass-log-out your entire existing user base the instant it ships — the first login after deploy sets the baseline; only a login after that can trigger an actual kick-out. Doesn't interact with normal logout (that already clears Supabase's own session cookie, which is checked before this logic ever runs).

**Multi-number central inbox + history sync.** Conversations were already unified across a business's connected numbers at the data layer (the query was always business-scoped, never per-connection) — but the UI never showed *which* number a conversation was on. Fixed: a label chip per conversation and filter tabs (both hidden entirely when there's only one connection, so the common case stays uncluttered). Separately, `worker/src/connectionManager.ts` now handles Baileys' `messaging-history.set` event with `syncFullHistory: true`, so connecting a number backfills prior conversations rather than only showing messages sent after linking — real limits still apply on what WhatsApp itself chooses to sync, and historical media (photos/voice notes) isn't re-downloaded in bulk, only live media after connecting. Required a small trigger fix (`migration_inbox_history_sync.sql`) so bulk historical inserts don't inflate unread counts or let out-of-order messages stomp a newer conversation preview. Also fixed while touching this: group chats (`@g.us` JIDs) were never filtered out and would have polluted the contacts list with garbage "phone numbers."

## A bug this session's own work caught, unrelated to Inbox

`middleware.js` (project root, outside `app/`/`lib/`) still queried `.from("users")` — the pre-rename name. It sits outside where the original rename sweep was scoped (`app/` and `lib/` only), so it was missed entirely on the first pass. This runs on **every** `/dashboard/*` request; left unfixed, the core table rename would have redirected every authenticated user to `/welcome` incorrectly the moment it landed. Fixed. Worth a final root-level sweep before actually running the rename in production, in case anything else lives outside those two folders.

## Decisions still open (haven't made these unilaterally)

**Worker sharding at scale.** One live process per connected WhatsApp number. Fine for a handful of businesses; flagged with a comment in `worker/src/connectionManager.ts` for when that stops being true.

**`user_referral_rewards`, `manual_sale_confirmations`, `marketing_assets`** — real FK relationships, indexes, RLS, and deliberate business-logic comments in `schema.sql`, but zero application code anywhere touches them. Reads like backend-built-ahead-of-frontend, not dead code — kept and prefixed rather than dropped, since only you know whether these are genuinely shelved.

**`seo_keyword_targets`, `waitlist_requests`, `notify_requests`** — no `CREATE TABLE` anywhere in this repo despite being live, actively-used tables. Worth adding proper migration files for these at some point so `schema.sql` stops silently disagreeing with reality.

## Sendchamp / OTP
Untouched throughout every session. Inbox has no code path anywhere near phone verification.

## Build-verified
`npm run build` and `npm test` (27/27) both run clean against this exact code before delivery, most recently after the pricing update and single-session feature.
