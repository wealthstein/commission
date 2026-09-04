# Inbox — merge notes

WhatsApp team inbox + lightweight CRM, merged into Commission at `/dashboard/inbox`, with matching marketing
pages, pricing, and a restored team-management system.

## Repo layout
```
commission/
├── commission-app/     Commission's Next.js app, with Inbox merged in
└── worker/              Separate always-on Node service holding the WhatsApp (Baileys) connection
```

## Database migrations — run in this exact order
1. `supabase/schema.sql`
2. Every other `supabase/migration_*.sql` file **except** `migration_inbox.sql` and `migration_rename_core_tables.sql` (these predate Inbox and rename `products`→`campaigns` along the way — several functions/policies were rewritten by hand to match, see `migration_rename_core_tables.sql`'s header)
3. `supabase/migration_inbox.sql`
4. `supabase/migration_rename_core_tables.sql` — **last**. Renames every table to a domain-prefixed name (`core_`, `affiliate_`, `billing_`, `growth_`, `inbox_`) using `ALTER TABLE RENAME`, which preserves all data/FKs. Also redefines every function/RLS policy whose body referenced a renamed table by text (Postgres doesn't auto-rewrite those on rename — only FKs/views/`language sql` are OID-tracked; `language plpgsql` bodies are opaque text and would silently break without this).

## What's built

**Inbox core** — `app/dashboard/inbox/**`: Chats, Pipeline, Leads, Tasks, Inventory, Insights, Connections. Styled with Commission's actual theme, not the standalone build's WhatsApp-teal look. Tables are `inbox_`-prefixed and hang off `core_businesses`/`core_users`/`core_business_team_members` — no separate tenancy model, no collision with Commission's own (deliberately PII-free) `affiliate_leads`.

**Team management — restored.** `/api/team/invite`, `/api/team/accept`, `/api/team/[memberId]` were previously stubbed to always `403` (a deliberate call made when the plan-tier pricing model changed). Real logic is back, reusing the email templates that were never actually deleted (`sendTeamInviteEmail`/`sendTeamInviteAcceptedEmail` in `lib/email.js`). New "Team" tab on the Account page. Also fixed: the Account page previously only resolved a business via `owner_id`, so a team member accepting an invite saw a blank page — now falls back to an active `core_business_team_members` row. And: `affiliate_programs_owner_manage`/`custom_fields_manage`/`leads_program_owner_select` were explicitly simplified to owner-only "until Team Management comes back" — it did, so these now use `is_business_member()` (owner or active team member).

**Marketing** — `/inbox` page (hero, benefits, features, use cases, FAQ), a navbar link, and a business-audience homepage section, all sharing `components/marketing/WhatsAppComparisonSection.js`. The "WhatsApp converts better" claims use real industry figures (Meta/Twilio/Mailchimp benchmarks), not literal "99.99%" — and are deliberately honest that SMS matches WhatsApp on raw open rates; the real differentiators argued are conversation quality, media, cost, and not being algorithm-gated.

**Pricing** — `content/pricingPlans.json` now lists WhatsApp number + team seat limits per tier (Small: 1 number/2 seats, Medium: 3/10, Large: 10/unlimited) plus tier-appropriate features. These numbers are **enforced**, not just marketing copy — `lib/inboxPlanLimits.js` is the single source of truth, checked in `/api/inbox/connections/create` (number limit) and `/api/team/invite` (seat limit, shared platform-wide since a seat is a seat regardless of which part of the app someone uses).

**Push notifications (site-wide PWA) — built.** `next-pwa` in InjectManifest mode, `public/manifest.json` (Commission's actual yellow/ink branding, icons generated from the existing `square.png`/`rounded.png` brand assets), and `pwa/custom-sw.js` (push + notificationclick handling, generic `{title, body, url, icon, tag}` contract so it's not Inbox-specific infrastructure even though Inbox is the only current caller). `lib/inbox/usePushNotifications.js` + a Snackbar prompt in the Inbox layout handle the subscribe flow; clicking a notification deep-links to `/dashboard/inbox?conversation=<id>`, which the Inbox page now resolves and opens automatically. This is genuinely site-wide — every marketing page gets the service worker and is installable as a PWA, not just the dashboard, per an explicit choice made when asked.

## Decisions still open (haven't made these unilaterally)

**Worker sharding at scale.** The worker holds one live process per connected WhatsApp number. Fine for a handful of businesses; past a few dozen concurrent connections you'll want to think about sharding across multiple worker instances (flagged with a comment in `worker/src/connectionManager.ts`).

**Presence-aware routing edge case.** `first_available` lead routing prefers online agents (via the worker observing the same presence channel the dashboard uses) but falls back to load-balancing everyone if nobody's online — reasonable default, not fine-tuned further.

## Sendchamp / OTP
Untouched throughout every session. `lib/sendchamp.js`, `lib/sms.js`, `/api/account/send-phone-otp`, `/api/account/verify-phone-otp` — none of it was touched. Inbox has no code path anywhere near phone verification.

## Build-verified
`commission-app` (`npm run build`) and `worker` (`npm run build`) were both run end-to-end against this exact code before delivery, most recently after adding the site-wide PWA/push notifications. All ~130+ pre-existing Commission pages compile, all Inbox routes compile, `public/sw.js` generates correctly with the push handlers and a full precache manifest, zero errors.
