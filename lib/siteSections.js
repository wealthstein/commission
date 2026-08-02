/**
 * Content for the six site-section categories from the internal-links
 * sketch that did not have dedicated pages yet: Conversions, Locations,
 * Campaigns, Features, Solutions, Integrations. Each array feeds a matching
 * pair of routes (index + [slug]) built on the shared
 * components/marketing/SectionPageContent.js template - see
 * app/conversions, app/locations, app/campaigns, app/features,
 * app/solutions, app/integrations.
 */

export const conversions = [
  {
    slug: "qualified-leads",
    name: "Qualified Leads",
    headline: "Pay only when a lead is actually qualified",
    intro:
      "A qualified-lead campaign never charges you for a click or a form submission alone. An affiliate shares a link, the prospect moves through a short form and a WhatsApp handoff, and only once they complete the full qualification step does anything leave your Campaign Wallet.",
    points: [
      { title: "No live payment required from the customer", body: "The prospect never pays anything through Commission on this path - you decide separately how they pay you for what they are enquiring about." },
      { title: "You set the price per lead", body: "Every industry has a different typical cost per qualified lead - you choose what one is worth to your business specifically." },
      { title: "WhatsApp-native handoff", body: "Prospects move straight into a WhatsApp conversation with your team, matching how most Nigerian sales conversations already happen." },
    ],
  },
  {
    slug: "direct-sales",
    name: "Direct Sales",
    headline: "Split every sale with your affiliates automatically",
    intro:
      "A direct-sale campaign is for products a customer can pay for immediately. The customer pays through a Commission-hosted checkout, and Paystack splits that single payment automatically - your proceeds route straight to your own settlement account, and the affiliate commission is paid out from the rest.",
    points: [
      { title: "One transaction, split instantly", body: "No manual transfers after the fact - the split happens at the moment of payment." },
      { title: "Minimum 10% commission", body: "Direct-sale campaigns commit at least 10% total across tiers, so it is always worth an affiliate's time to promote one." },
      { title: "Up to 3 commission tiers", body: "Reward the affiliate who made the sale, and whoever referred them, up to two levels deep." },
    ],
  },
  {
    slug: "choosing-a-conversion-goal",
    name: "Conversion Goal",
    headline: "Qualified Leads or Direct Sales - which fits your business",
    intro:
      "Every campaign on Commission picks one of two conversion goals at setup, and it shapes the entire payment flow. Here is how to decide which one fits what you are selling.",
    points: [
      { title: "High-consideration or enquiry-first products", body: "Real estate, insurance, loans, and enrollments usually fit Qualified Leads - the customer needs a conversation before paying anything." },
      { title: "Instantly purchasable products", body: "A fixed-price product or service someone can pay for on the spot usually fits Direct Sales." },
      { title: "You can only pick one per campaign", body: "Each product's active campaign has a single conversion goal - list the same product twice if you genuinely need both paths." },
    ],
  },
  {
    slug: "minimum-commission",
    name: "Minimum Commission",
    headline: "Why direct-sale campaigns require at least 10% commission",
    intro:
      "Commission enforces a 10% minimum total commission across tiers on every direct-sale campaign - both in the product form and as a database-level rule - so listing one is never a waste of an affiliate's time.",
    points: [
      { title: "Applies to direct-sale campaigns only", body: "Qualified-lead campaigns set a flat cost per lead instead, with no percentage minimum." },
      { title: "Enforced twice", body: "Checked when you create the campaign, and again at the database level, so it can never be bypassed." },
      { title: "Split across up to 3 tiers", body: "The 10% minimum is the total across all tiers combined, not a per-tier requirement." },
    ],
  },
  {
    slug: "whatsapp-flow-explained",
    name: "WhatsApp Flow",
    headline: "How a qualified lead actually moves through WhatsApp",
    intro:
      "A qualified-lead campaign is built around a specific funnel: a Short Form, a unique WhatsApp handoff, a Long Form, and then a Thank You page - here is what happens at each step.",
    points: [
      { title: "1. Short Form", body: "The prospect gives their name, phone, and email on a Commission-hosted page after clicking an affiliate's link." },
      { title: "2. WhatsApp handoff", body: "A unique link opens a WhatsApp conversation with your team, with the prospect's name already included." },
      { title: "3. Long Form and qualification", body: "The prospect completes a longer form, which is what actually charges your Campaign Wallet and pays your affiliates." },
    ],
  },
  {
    slug: "wallet-vs-checkout",
    name: "Wallet vs Checkout",
    headline: "Two different payment mechanisms, one for each conversion goal",
    intro:
      "Qualified Leads and Direct Sales do not just differ in what counts as a conversion - the money moves completely differently behind the scenes for each one.",
    points: [
      { title: "Qualified Leads uses a prepaid wallet", body: "The business tops up a Campaign Wallet in advance, and a qualified lead deducts from it automatically." },
      { title: "Direct Sales uses a live checkout split", body: "The customer pays Commission directly, and Paystack splits that single payment between the business and the affiliate commission instantly." },
      { title: "Neither requires manual settlement", body: "Both are fully automatic once set up - the difference is only in when and how the money moves." },
    ],
  },
];

export const locations = [
  {
    slug: "lagos",
    name: "Lagos",
    headline: "Affiliate marketing for businesses in Lagos",
    intro:
      "Lagos has Nigeria's densest concentration of both businesses looking to grow and affiliates with real audiences ready to promote them. Commission works the same way everywhere - list a campaign, set what a qualified lead or sale is worth, and let affiliates do the rest.",
    points: [
      { title: "A large affiliate pool", body: "Lagos has one of the highest concentrations of active affiliates on Commission." },
      { title: "WhatsApp-first, matching local habits", body: "Most Lagos consumers already expect to finish a purchase conversation on WhatsApp." },
      { title: "Works across industries", body: "From real estate to fintech, Lagos businesses across every industry Commission supports can list a campaign." },
    ],
  },
  {
    slug: "abuja",
    name: "Abuja",
    headline: "Affiliate marketing for businesses in Abuja",
    intro:
      "Abuja businesses - from financial services to real estate - use Commission to reach customers through affiliates who already have their trust, instead of relying on broad, expensive advertising alone.",
    points: [
      { title: "Reach beyond your existing network", body: "Affiliates already active on Commission can promote your campaign to audiences you would not otherwise reach." },
      { title: "Pay only for outcomes", body: "Nothing leaves your Campaign Wallet until a lead is qualified or a sale is verified." },
      { title: "Simple to set up", body: "List a product and launch a campaign in minutes." },
    ],
  },
  {
    slug: "port-harcourt",
    name: "Port Harcourt",
    headline: "Affiliate marketing for businesses in Port Harcourt",
    intro:
      "Port Harcourt businesses can list a campaign on Commission and reach customers through affiliates already active in the city and beyond, paying only when a lead qualifies or a sale happens.",
    points: [
      { title: "Local and national reach at once", body: "An affiliate based in Port Harcourt can promote your campaign locally, while others reach customers nationwide." },
      { title: "No upfront ad spend risk", body: "You only pay for a result, not for reach that may not convert." },
      { title: "Automatic, tracked commissions", body: "Every referral is tracked from click through to conversion." },
    ],
  },
  {
    slug: "asaba",
    name: "Asaba",
    headline: "Affiliate marketing for businesses in Asaba",
    intro:
      "Asaba businesses can use Commission the same way larger-city businesses do - list a campaign, set a price per qualified lead or a sale commission, and let affiliates bring you customers.",
    points: [
      { title: "Grow without a large marketing team", body: "Affiliates do the promoting - you only need to fulfill and confirm the result." },
      { title: "Pay-for-performance", body: "No fixed monthly ad spend commitment beyond your Commission subscription." },
      { title: "Simple WhatsApp-based follow-up", body: "Leads land in a WhatsApp conversation with your team, not an unfamiliar new tool." },
    ],
  },
  {
    slug: "ibadan",
    name: "Ibadan",
    headline: "Affiliate marketing for businesses in Ibadan",
    intro:
      "Ibadan businesses can list a campaign on Commission and reach customers through affiliates already active across the city and beyond, paying only for a genuine result.",
    points: [
      { title: "Reach beyond word of mouth alone", body: "Affiliates can promote your campaign well past your existing customer network." },
      { title: "No ad spend risk", body: "You only pay when a lead qualifies or a sale is verified." },
      { title: "Simple to launch", body: "List a product and set a price per result in minutes." },
    ],
  },
  {
    slug: "enugu",
    name: "Enugu",
    headline: "Affiliate marketing for businesses in Enugu",
    intro:
      "Enugu businesses can use Commission to turn a network of affiliates into a pay-for-performance sales channel, without committing to fixed monthly ad spend.",
    points: [
      { title: "Grow without a large marketing team", body: "Affiliates do the promoting on your behalf." },
      { title: "Pay only for outcomes", body: "Nothing is charged until a lead qualifies or a sale happens." },
      { title: "Automatic, tracked commissions", body: "Every referral is tracked from click through to conversion." },
    ],
  },
];

export const campaignTypes = [
  {
    slug: "health-insurance",
    name: "Health Insurance",
    headline: "Fill more health insurance enrollments through affiliates",
    intro:
      "List a health insurance plan as a qualified-lead campaign, set what a genuine enrollment inquiry is worth to you, and let affiliates - including agents and satisfied policyholders - promote it for a tracked commission.",
    points: [
      { title: "Pay per qualified enrollment inquiry", body: "Only your Campaign Wallet is charged once a genuine inquiry is confirmed." },
      { title: "Agents and everyday affiliates, side by side", body: "Independent agents and everyday affiliates can promote the same plan." },
      { title: "WhatsApp-first follow-up", body: "A prospect moves straight into a WhatsApp conversation with your team." },
    ],
  },
  {
    slug: "business-loans",
    name: "Business Loans",
    headline: "Reach more loan applicants through affiliates",
    intro:
      "List a business loan product on Commission and pay only for a qualified applicant inquiry, reaching business owners through affiliates who already have their trust.",
    points: [
      { title: "Pay per qualified applicant inquiry", body: "Nothing is charged until an inquiry is confirmed as genuine." },
      { title: "Trusted referrals convert better in lending", body: "A recommendation carries more weight than a cold advert for a financial decision." },
      { title: "Full attribution, automatically", body: "Every referral is tracked from click through to a qualified inquiry." },
    ],
  },
  {
    slug: "personal-budgeting",
    name: "Personal Budgeting",
    headline: "Grow sign-ups for your budgeting product through affiliates",
    intro:
      "List a personal budgeting app or service and let finance-focused affiliates - creators, community leaders, everyday users - promote it for a tracked commission on every qualified sign-up.",
    points: [
      { title: "Pay per qualified sign-up", body: "Set a cost per qualified lead that matches your own unit economics." },
      { title: "Reach community-driven audiences", body: "Affiliates already embedded in personal-finance communities can share a link naturally." },
      { title: "Transparent, automatic attribution", body: "Every referral is tracked from the original click through to conversion." },
    ],
  },
  {
    slug: "account-opening",
    name: "Account Opening",
    headline: "Grow account openings through affiliate referrals",
    intro:
      "List an account-opening campaign and pay affiliates for every qualified sign-up they bring in, instead of relying on broad advertising alone.",
    points: [
      { title: "Pay per qualified account opening inquiry", body: "Only charged once a genuine, qualified inquiry is confirmed." },
      { title: "Existing customers can be affiliates too", body: "Happy customers who already recommend you informally can now earn for it." },
      { title: "Automatic, tiered commissions", body: "Reward the affiliate who referred someone, and whoever referred them, up to two levels deep." },
    ],
  },
  {
    slug: "life-insurance",
    name: "Life Insurance",
    headline: "Grow life insurance policy inquiries through affiliates",
    intro:
      "List a life insurance product as a qualified-lead campaign and pay agents and everyday affiliates alike for every genuine policy inquiry they bring in.",
    points: [
      { title: "Pay per qualified policy inquiry", body: "Only charged once a genuine inquiry is confirmed." },
      { title: "Agents and affiliates, side by side", body: "Independent agents and everyday affiliates can promote the same policy." },
      { title: "WhatsApp-first follow-up", body: "A prospect moves straight into a WhatsApp conversation with your team." },
    ],
  },
  {
    slug: "savings-investments",
    name: "Savings & Investments",
    headline: "Grow sign-ups for your savings or investment product",
    intro:
      "List a savings or investment product and let finance-focused affiliates promote it for a tracked commission on every qualified sign-up.",
    points: [
      { title: "Pay per qualified sign-up", body: "Set a cost per qualified lead that matches your own unit economics." },
      { title: "Reach community-driven audiences", body: "Affiliates already embedded in personal-finance communities can share a link naturally." },
      { title: "Transparent, automatic attribution", body: "Every referral is tracked from the original click through to conversion." },
    ],
  },
];

export const features = [
  {
    slug: "lead-tracking",
    name: "Lead Tracking",
    headline: "Every click and every lead, tracked automatically",
    intro:
      "Every referral link click is recorded and attributed to the affiliate who shared it, through to whether it became a qualified lead - all without any manual reconciliation.",
    points: [
      { title: "Click-level attribution", body: "Each click is tied to the specific affiliate link that generated it, with a configurable attribution window." },
      { title: "Full-funnel visibility", body: "See a lead move from click through to qualified, right in your dashboard." },
      { title: "No spreadsheets required", body: "Attribution and tracking happen automatically, not through manual matching." },
    ],
  },
  {
    slug: "multi-tier-payout",
    name: "Multi-tier Payout",
    headline: "Reward more than just the affiliate who made the sale",
    intro:
      "Commission supports up to 3 affiliate tiers per campaign - the affiliate who referred a sale or lead, whoever referred them, and whoever referred that person, each earning a tracked share automatically.",
    points: [
      { title: "Up to 3 tiers per campaign", body: "Set a percentage or share for each tier when you launch your campaign." },
      { title: "Calculated and paid automatically", body: "The commission engine splits every qualified lead or sale across tiers with no manual math." },
      { title: "Encourages affiliates to recruit others", body: "A tiered structure gives affiliates a reason to bring in other affiliates, growing your reach." },
    ],
  },
  {
    slug: "affiliate-tracking",
    name: "Affiliate Tracking",
    headline: "See exactly who is promoting your campaigns",
    intro:
      "Every affiliate enrolled in your campaign, their referral activity, and their earnings are visible in one place - no need to chase updates manually.",
    points: [
      { title: "A full network view", body: "See your affiliates and, for tiered campaigns, who referred whom." },
      { title: "Per-affiliate performance", body: "See clicks, qualified leads or sales, and earnings broken down by affiliate." },
      { title: "No separate spreadsheet needed", body: "All tracked directly in your Commission dashboard." },
    ],
  },
  {
    slug: "data-analytics",
    name: "Data Analytics",
    headline: "See how your campaigns are actually performing",
    intro:
      "Your dashboard shows transactions, leads, and payouts as they happen, so you can see what is working without piecing it together from multiple tools.",
    points: [
      { title: "Transaction and lead history", body: "Every sale and lead tied to your campaigns, with status and amount." },
      { title: "Payout visibility", body: "See what has been paid to affiliates and what is pending." },
      { title: "Straightforward, not a full BI suite", body: "This is a practical operations view for running your campaigns, not a replacement for dedicated analytics software." },
    ],
  },
  {
    slug: "campaign-wallet",
    name: "Campaign Wallet",
    headline: "Prepay once, let qualified leads deduct automatically",
    intro:
      "A qualified-lead campaign runs on a Campaign Wallet - top it up through Paystack, and every qualified lead deducts its cost automatically, with no manual invoicing.",
    points: [
      { title: "Fund it whenever you like", body: "Top up via Paystack in your Account page any time." },
      { title: "Automatic, atomic deductions", body: "Every qualified lead deducts its cost the moment it qualifies, with row-level locking so a balance is never double-spent." },
      { title: "Full transaction history", body: "See every top-up and deduction in one place." },
    ],
  },
  {
    slug: "custom-branding",
    name: "Custom Branding",
    headline: "Your own logo and colors on your campaign pages",
    intro:
      "Commission hosts your Short Form and Long Form pages, and Medium and Large plans can add their own logo and brand color so those pages still feel like yours.",
    points: [
      { title: "Available on Medium and Large plans", body: "A premium feature - Small plans use Commission's own default look." },
      { title: "Your logo on both hosted pages", body: "Shown on the Short Form and the Long Form a prospect completes." },
      { title: "Large plans add brand color too", body: "A further step of customization on top of the logo." },
    ],
  },
];

export const solutions = [
  {
    slug: "lead-generation",
    name: "Lead Generation",
    headline: "Generate qualified leads without paying for every click",
    intro:
      "Instead of paying an ad platform for reach that may or may not convert, list a qualified-lead campaign on Commission and only pay once a lead is actually confirmed.",
    points: [
      { title: "Pay for outcomes, not clicks", body: "Nothing leaves your Campaign Wallet until a lead qualifies." },
      { title: "Built-in distribution", body: "Affiliates already active on Commission can start promoting your campaign the same day you list it." },
      { title: "WhatsApp-native funnel", body: "Prospects move into a WhatsApp conversation with your team automatically." },
    ],
  },
  {
    slug: "revenue-boost",
    name: "Revenue Boost",
    headline: "Add a performance-based sales channel alongside what you already do",
    intro:
      "A direct-sale campaign on Commission adds a new, pay-for-performance channel on top of your existing sales efforts - customers pay through a Commission-hosted checkout, split automatically between you and the affiliates who brought the sale.",
    points: [
      { title: "Additive, not a replacement", body: "Run a Commission campaign alongside your existing sales channels." },
      { title: "No upfront cost beyond your subscription", body: "You only pay affiliates out of sales they actually generate." },
      { title: "Automatic settlement", body: "Your share of every sale lands in your own account the moment a customer pays." },
    ],
  },
  {
    slug: "performance-marketing",
    name: "Performance Marketing",
    headline: "A marketing channel where you only pay for results",
    intro:
      "Commission is built around one idea: you only pay when something actually happens - a qualified lead or a verified sale - not for impressions, clicks, or reach.",
    points: [
      { title: "Outcome-based by design", body: "Every campaign is priced around a qualified lead or a sale, never an impression." },
      { title: "Transparent attribution", body: "Every referral is tracked automatically from click to conversion." },
      { title: "Compare it directly", body: "See how this compares to specific channels on the Comparison pages." },
    ],
  },
  {
    slug: "customer-acquisition",
    name: "Customer Acquisition",
    headline: "Acquire customers through people who already have an audience",
    intro:
      "Rather than building reach from scratch through advertising, Commission lets you acquire customers through affiliates who already have an audience that trusts them.",
    points: [
      { title: "Warmer than cold advertising", body: "A referral from someone a prospect already follows converts differently than an anonymous ad." },
      { title: "Scales past any one relationship", body: "Any number of affiliates can promote the same campaign at once." },
      { title: "Pay only for a genuine result", body: "A qualified lead or a verified sale, never just reach." },
    ],
  },
  {
    slug: "affiliate-recruitment",
    name: "Affiliate Recruitment",
    headline: "Build a distribution network without hiring a sales team",
    intro:
      "List a campaign on Commission and it becomes discoverable to a network of affiliates already active on the platform - no recruiting effort required on your part beyond setting your commission.",
    points: [
      { title: "Discoverable to existing affiliates", body: "Live campaigns show up on Commission's Discover and Programs pages." },
      { title: "Tiered recruiting, built in", body: "Affiliates are incentivized to recruit other affiliates through the 3-tier commission structure." },
      { title: "No fixed hiring cost", body: "You only pay a commission on results, never a salary or retainer." },
    ],
  },
  {
    slug: "market-expansion",
    name: "Market Expansion",
    headline: "Reach new cities and audiences through local affiliates",
    intro:
      "Affiliates already active in cities and communities you have not reached directly can promote your campaign there, without you needing a local presence first.",
    points: [
      { title: "Reach without a local office", body: "An affiliate based in a new city can promote your campaign there on your behalf." },
      { title: "Pay only for results in that market", body: "No fixed local marketing spend - you pay per qualified lead or sale, wherever it comes from." },
      { title: "Scales as you grow", body: "Add more campaigns or cities without rebuilding your acquisition approach each time." },
    ],
  },
];

export const integrations = [
  {
    slug: "whatsapp",
    name: "WhatsApp",
    headline: "WhatsApp is native to every qualified-lead campaign",
    intro:
      "WhatsApp is not an add-on - it is built directly into the qualified-lead funnel. A prospect moves from an affiliate's link into a WhatsApp conversation with your team automatically, no setup beyond adding your number.",
    points: [
      { title: "Native, not bolted on", body: "The Short Form to WhatsApp handoff is a built-in step of every qualified-lead campaign, not a separate integration to configure." },
      { title: "Matches how Nigerian sales conversations already happen", body: "No new tool for your team or your customer to learn." },
      { title: "Set your number once", body: "Configure your WhatsApp number on your Account page or per campaign." },
    ],
  },
  {
    slug: "email",
    name: "Email",
    headline: "Email is a native lead-forwarding destination",
    intro:
      "Every qualified lead can be forwarded straight to an email address you set - no webhook, no third-party tool, no setup beyond adding the address on your Account page. This is on by default and works alongside a webhook if you add one too.",
    points: [
      { title: "Native, available on every plan", body: "Unlike API access, email forwarding is not a premium feature - every business can use it." },
      { title: "Falls back automatically", body: "If no notification email is set, forwarding falls back to your account owner's email so a lead is never lost." },
      { title: "Full lead details included", body: "Name, phone, email, and any qualifying details are sent the moment a lead qualifies." },
    ],
  },
  {
    slug: "api",
    name: "API",
    headline: "Route every qualified lead anywhere, automatically",
    intro:
      "With API access, a business can route qualified leads to any system they choose - a CRM, a spreadsheet automation, an internal tool, or anywhere else - by pointing Commission at a webhook URL they control. API access is a premium feature on Medium and Large plans.",
    points: [
      { title: "Premium feature", body: "API access is available on Medium and Large plans, not the Small plan." },
      { title: "Route leads anywhere", body: "Point your webhook at any endpoint you control - the destination is entirely up to you." },
      { title: "Works alongside email", body: "Use API routing and email forwarding together, or API routing alone." },
    ],
  },
  {
    slug: "freshsales",
    name: "Freshsales",
    headline: "Send qualified leads into Freshsales via the API",
    intro:
      "Commission does not have a pre-built Freshsales connector - but with API access, every qualified lead can be forwarded to a webhook URL you control, which you point at a Freshsales-compatible inbound webhook or automation tool to land leads there directly.",
    points: [
      { title: "Possible via API, not a native app", body: "This works through Commission's API access feature, not a dedicated Freshsales integration." },
      { title: "Full lead details forwarded", body: "Name, phone, email, and any qualifying details are sent the moment a lead qualifies." },
      { title: "Requires a Medium or Large plan", body: "API access is a premium feature - see the Integrations: API page for details." },
    ],
  },
  {
    slug: "zoho-crm",
    name: "Zoho CRM",
    headline: "Send qualified leads into Zoho CRM via the API",
    intro:
      "There is no dedicated Zoho CRM app - with API access, Commission forwards every qualified lead to a webhook URL you control, which you can point at Zoho's inbound webhook or an automation tool that feeds Zoho CRM.",
    points: [
      { title: "Possible via API, not a native app", body: "Configured the same way as any other API destination on your Account page." },
      { title: "No lead sits only in Commission", body: "Commission never stores a lead's identity itself - it forwards it, so your CRM stays the source of truth." },
      { title: "Requires a Medium or Large plan", body: "API access is a premium feature." },
    ],
  },
  {
    slug: "supabase",
    name: "Supabase",
    headline: "Commission is built on Supabase - route leads to your own project via the API",
    intro:
      "Commission's own database runs on Supabase. With API access, a business with their own Supabase project can point their webhook at a Supabase Edge Function or database webhook to land qualified leads directly in their own tables.",
    points: [
      { title: "Possible via API, not a managed integration", body: "This works through Commission's API access feature - you build the receiving endpoint." },
      { title: "Full control over your own data", body: "Leads land directly in infrastructure you already own." },
      { title: "Requires a Medium or Large plan", body: "API access is a premium feature." },
    ],
  },
];
