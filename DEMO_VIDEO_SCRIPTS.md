# Commission — Demo Video Scripts

Both scripts are written for roughly 90 seconds - 2 minutes, matching the
subtitle already written into the DemoVideoSection component ("A 2-minute
walkthrough..."). Each scene lists a rough duration, the voiceover line,
and the on-screen action needed. Screen-record the actual dashboard for
every "on-screen" beat rather than staging mockups - the real product is
more convincing than a recreation.

Once a real video exists, drop its embed URL into content/homepage.json:
- `audienceContent.business.demoVideoUrl` for the business version
- `audienceContent.affiliate.demoVideoUrl` for the affiliate version

Both fields are already there, currently empty - DemoVideoSection.js
renders a clean "coming soon" placeholder until a real URL is added, so
nothing breaks in the meantime.

---

## Business version — "See how a campaign actually runs"

**Scene 1 (0:00–0:10) — Cold open on the problem**
VO: "You've paid for ads that never convert. Commission works differently — you only pay when a lead is real."
On screen: Quick cut of a generic ad-spend dashboard, then a hard cut to Commission's homepage.

**Scene 2 (0:10–0:25) — Creating a campaign**
VO: "Set up a campaign in minutes. Name it, set your price, set what a qualified lead is worth to you."
On screen: Screen-record `/dashboard/campaigns/new` — fill in name, price, cost per qualified lead, click Publish.

**Scene 3 (0:25–0:40) — Sharing and Radar**
VO: "Affiliates share your link. Radar checks every lead against that affiliate's real track record automatically — before it ever reaches you."
On screen: Cut to the referral link being shared (a phone screen showing a WhatsApp/social share), then a quick animated beat showing "Radar check → Trusted → straight through" vs "New → quick verification."

**Scene 4 (0:40–0:55) — A lead comes in**
VO: "When a real prospect qualifies, you're notified immediately — full details, right in your inbox or your dashboard."
On screen: Screen-record an email notification arriving, then the Transactions → Leads tab showing the new qualified lead.

**Scene 5 (0:55–1:10) — Payment happens automatically**
VO: "Commission pays your affiliates automatically, straight from your Campaign Wallet. No manual invoicing, no chasing anyone."
On screen: Screen-record the wallet balance ticking down, then a payout confirmation.

**Scene 6 (1:10–1:20) — Close**
VO: "Set it up once. Let your affiliates do the rest."
On screen: Commission logo, "Get started" CTA matching the homepage button.

---

## Affiliate version — "See how promoting actually works"

**Scene 1 (0:00–0:10) — Cold open on the hook**
VO: "You already have an audience. Commission turns that into real income — no inventory, no upfront cost."
On screen: Quick montage of a phone screen (Instagram, WhatsApp, TikTok icons), then a hard cut to Commission's homepage in affiliate mode.

**Scene 2 (0:10–0:25) — Signing up and finding a program**
VO: "Sign in with Google — no separate signup. Then browse real programs from real Nigerian businesses."
On screen: Screen-record Google sign-in, then the Discover page showing a few campaign cards.

**Scene 3 (0:25–0:35) — Joining and getting a link**
VO: "Join a program, and you instantly get your own unique referral link."
On screen: Screen-record clicking "Join this affiliate program," landing on My Promotions, copying the referral link.

**Scene 4 (0:35–0:55) — Sharing and earning**
VO: "Share it anywhere — WhatsApp, Instagram, your blog. When someone you referred qualifies, you're paid — automatically, whether or not they even end up buying."
On screen: Phone screen showing the link being pasted into a WhatsApp status or Instagram bio, then a quick animated beat: "Referral clicked → Lead qualifies → You're paid."

**Scene 5 (0:55–1:10) — Multi-tier, if applicable**
VO: "Bring in other affiliates, and you earn from their referrals too — up to three tiers deep."
On screen: Simple animated diagram, tier 1 → tier 2 → tier 3, small percentage labels on each.

**Scene 6 (1:10–1:20) — Close**
VO: "One link. Every channel. Real payouts."
On screen: Commission logo, "Get started" CTA matching the homepage button.
