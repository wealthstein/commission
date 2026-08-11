/**
 * Content for the six site-section categories from the internal-links
 * sketch that did not have dedicated pages yet: Conversions, Locations,
 * Campaigns, Features, Solutions, Integrations. Each array feeds a matching
 * pair of routes (index + [slug]) built on the shared
 * components/marketing/SectionPageContent.js template - see
 * app/conversions, app/locations, app/campaigns, app/features,
 * app/solutions, app/integrations.
 */

export const challenges = [
  {
    slug: "didnt-submit-any-form",
    name: "\"I never submitted any form\"",
    headline: "When a prospect denies ever filling out your form",
    intro:
      "This is one of the most common responses a business hears after following up on a lead - and it's genuinely hard to know whether the prospect forgot, is stalling, or the lead was never real to begin with. Radar exists specifically to cut down how often you hear this.",
    points: [
      { title: "Why it happens", body: "Anyone can type a name and number into an open web form with zero verification behind it - so some leads reaching your inbox were never a real, willing prospect in the first place." },
      { title: "Why it's costly", body: "Every follow-up call to a lead like this is time spent chasing someone who was never going to convert, and (on a lead-goal campaign) a charge that shouldn't have happened." },
      { title: "How Commission approaches it", body: "Radar checks an affiliate's own track record before a customer ever reaches your form, and adds a quick verification step for unproven affiliates - all without slowing down the leads that are already trustworthy." },
    ],
  },
  {
    slug: "wrong-number",
    name: "\"That's not my number\"",
    headline: "When the phone number on a lead doesn't match anyone real",
    intro:
      "A wrong or fake number is one of the fastest ways a lead-gen budget gets wasted - the call never even connects to a real conversation. Radar is built to catch this before it reaches you.",
    points: [
      { title: "Why it happens", body: "A plain text field has no way to confirm a number is real, active, and actually belongs to the person submitting it." },
      { title: "Why it's costly", body: "A wrong number isn't just a wasted call - on some campaigns it's a wasted charge, for contact information that was never real." },
      { title: "How Commission approaches it", body: "Radar's verification step is specifically designed to filter this exact pattern out, weighted by how trustworthy the referring affiliate has proven to be over time." },
    ],
  },
  {
    slug: "wrong-name",
    name: "\"That's not my name\"",
    headline: "When the name on a lead doesn't match who actually answers",
    intro:
      "Alongside wrong numbers, mismatched names are one of the clearest signs a lead was never genuinely submitted by the person it claims to represent.",
    points: [
      { title: "Why it happens", body: "Some leads are submitted carelessly, by a third party, or with placeholder information entirely - none of which a simple form can catch on its own." },
      { title: "Why it's costly", body: "It erodes trust in your entire lead pipeline, making it harder to tell your genuinely good leads apart from the noise." },
      { title: "How Commission approaches it", body: "Radar's affiliate-level trust scoring means leads from affiliates with a history of this kind of mismatch get extra scrutiny automatically, before you ever pick up the phone." },
    ],
  },
  {
    slug: "price-too-high",
    name: "\"The price is too high\"",
    headline: "When budget mismatch shows up only after you've already followed up",
    intro:
      "Not every unqualified lead is fraudulent - some are genuine people who were simply never a realistic fit for what you're selling. This is a different problem from fake leads, and worth solving differently.",
    points: [
      { title: "Why it happens", body: "A generic interest form rarely asks anything that would surface a budget mismatch before you've already spent time following up." },
      { title: "Why it's costly", body: "Time spent on a lead that was never going to afford your offer is time not spent on one that could." },
      { title: "How Commission approaches it", body: "Campaign-specific custom questions let you ask exactly what matters for your offer - budget range, timeline, whatever's relevant - directly on the Intent Form." },
    ],
  },
  {
    slug: "not-interested",
    name: "\"I am not interested\"",
    headline: "When a lead flatly denies any interest at all",
    intro:
      "This is the response that most directly signals a lead was never real to begin with - not a budget mismatch, not a timing issue, just outright denial of ever expressing interest.",
    points: [
      { title: "Why it happens", body: "Without any real verification step, this is the easiest kind of low-quality lead to generate - accidentally or otherwise." },
      { title: "Why it's costly", body: "It's the single clearest signal that your lead source needs a trust layer, not just more volume." },
      { title: "How Commission approaches it", body: "Radar tracks this pattern at the affiliate level over time, so a source that consistently produces leads like this gets caught by the system, not just by your own frustration." },
    ],
  },
  {
    slug: "distance-too-far",
    name: "\"That's too far from me\"",
    headline: "When location mismatch turns a real lead into a wasted one",
    intro:
      "Especially common for real estate and any business tied to a physical location - a genuinely interested prospect who simply isn't in reach.",
    points: [
      { title: "Why it happens", body: "A basic interest form rarely captures location upfront, so distance mismatch only surfaces after you've already invested follow-up time." },
      { title: "Why it's costly", body: "Unlike a fake lead, this one was real - the loss here is inefficiency, not fraud, and it needs a different fix." },
      { title: "How Commission approaches it", body: "Custom Intent Form questions let you ask about location, service area, or reach directly - before your team spends time on a lead that geography rules out." },
    ],
  },
];

export const conversions = [
  {
    slug: "qualified-leads",
    name: "Intent Qualified Leads",
    headline: "Pay only when a lead is actually qualified",
    intro:
      "A qualified-lead campaign never charges you for a click or a form submission alone. An affiliate shares a link, the prospect moves through an Interest Form and a quick verification step, and only once they complete the full qualification step does anything leave your Campaign Wallet.",
    points: [
      { title: "No live payment required from the customer", body: "The prospect never pays anything through Commission on this path - you decide separately how they pay you for what they are enquiring about." },
      { title: "You set the price per lead", body: "Every industry has a different typical cost per Intent Qualified Lead - you choose what one is worth to your business specifically." },
      { title: "Radar filters fake leads automatically", body: "Every lead is checked against the referring affiliate's real track record before it reaches you." },
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
    headline: "Intent Qualified Leads or Direct Sales - which fits your business",
    intro:
      "Every campaign on Commission picks one of two conversion goals at setup, and it shapes the entire payment flow. Here is how to decide which one fits what you are selling.",
    points: [
      { title: "High-consideration or enquiry-first products", body: "Real estate, insurance, loans, and enrollments usually fit Intent Qualified Leads - the customer needs a conversation before paying anything." },
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
    name: "Lead Qualification Flow",
    headline: "How an Intent Qualified Lead actually moves through Commission",
    intro:
      "A qualified-lead campaign is built around a specific funnel: an Interest Form, a quick verification step for unproven affiliates, an Intent Form, and then a Thank You page - here is what happens at each step.",
    points: [
      { title: "1. Interest Form", body: "The prospect gives their name, phone, and email on a Commission-hosted page after clicking an affiliate's link." },
      { title: "2. Radar check", body: "Trusted affiliates' leads go straight through. Leads from an unproven affiliate see a quick verification step first, right on the same page." },
      { title: "3. Intent Form and qualification", body: "The prospect completes a longer form, which is what actually charges your Campaign Wallet and pays your affiliates." },
    ],
  },
  {
    slug: "wallet-vs-checkout",
    name: "Wallet vs Checkout",
    headline: "Two different payment mechanisms, one for each conversion goal",
    intro:
      "Intent Qualified Leads and Direct Sales do not just differ in what counts as a conversion - the money moves completely differently behind the scenes for each one.",
    points: [
      { title: "Intent Qualified Leads uses a prepaid wallet", body: "The business tops up a Campaign Wallet in advance, and a Intent Qualified Lead deducts from it automatically." },
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
      "Lagos has Nigeria's densest concentration of both businesses looking to grow and affiliates with real audiences ready to promote them. Commission works the same way everywhere - list a campaign, set what a Intent Qualified Lead or sale is worth, and let affiliates do the rest.",
    points: [
      { title: "A large affiliate pool", body: "Lagos has one of the highest concentrations of active affiliates on Commission." },
      { title: "Radar keeps leads clean", body: "Every lead is checked against the referring affiliate's real track record before it reaches you." },
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
      "Asaba businesses can use Commission the same way larger-city businesses do - list a campaign, set a price per Intent Qualified Lead or a sale commission, and let affiliates bring you customers.",
    points: [
      { title: "Grow without a large marketing team", body: "Affiliates do the promoting - you only need to fulfill and confirm the result." },
      { title: "Pay-for-performance", body: "No fixed monthly ad spend commitment beyond your Commission subscription." },
      { title: "Radar keeps leads clean", body: "Every lead is checked against the referring affiliate's real track record before it reaches you." },
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
      { title: "Radar keeps leads clean", body: "Every lead is checked against the referring affiliate's real track record before it reaches you." },
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
      { title: "Pay per qualified sign-up", body: "Set a cost per Intent Qualified Lead that matches your own unit economics." },
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
      { title: "Radar keeps leads clean", body: "Every lead is checked against the referring affiliate's real track record before it reaches you." },
    ],
  },
  {
    slug: "savings-investments",
    name: "Savings & Investments",
    headline: "Grow sign-ups for your savings or investment product",
    intro:
      "List a savings or investment product and let finance-focused affiliates promote it for a tracked commission on every qualified sign-up.",
    points: [
      { title: "Pay per qualified sign-up", body: "Set a cost per Intent Qualified Lead that matches your own unit economics." },
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
      "Every referral link click is recorded and attributed to the affiliate who shared it, through to whether it became a Intent Qualified Lead - all without any manual reconciliation.",
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
      { title: "Calculated and paid automatically", body: "The commission engine splits every Intent Qualified Lead or sale across tiers with no manual math." },
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
      { title: "Per-affiliate performance", body: "See clicks, Intent Qualified Leads or sales, and earnings broken down by affiliate." },
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
    headline: "Prepay once, let Intent Qualified Leads deduct automatically",
    intro:
      "A qualified-lead campaign runs on a Campaign Wallet - top it up through Paystack, and every Intent Qualified Lead deducts its cost automatically, with no manual invoicing.",
    points: [
      { title: "Fund it whenever you like", body: "Top up via Paystack in your Account page any time." },
      { title: "Automatic, atomic deductions", body: "Every Intent Qualified Lead deducts its cost the moment it qualifies, with row-level locking so a balance is never double-spent." },
      { title: "Full transaction history", body: "See every top-up and deduction in one place." },
    ],
  },
  {
    slug: "lead-management",
    name: "Lead Management",
    headline: "Filter, search, and export every lead - not just watch them go by",
    intro:
      "Lead Tracking shows a lead moving through your funnel automatically. Lead Management goes further - filter by status or date, search across everything captured, and (on Large) export to CSV whenever you need the raw data outside Commission.",
    points: [
      { title: "Filter and search", body: "Narrow leads by status, campaign, or date range instead of scrolling through everything - Medium and Large." },
      { title: "Export to CSV", body: "Download your lead data whenever you need it in a spreadsheet, CRM import, or report - Large only." },
      { title: "Included from Medium up", body: "Small gets the standard leads view; Medium adds filtering and search; Large adds unlimited export." },
    ],
  },
  {
    slug: "custom-fields",
    name: "Custom Fields",
    headline: "Design your own Intent Form questions, per campaign",
    intro:
      "Every campaign has its own idea of a qualified prospect. Add your own questions - budget, timeline, whatever matters for this specific campaign - and get real answers back with every Intent Qualified Lead, no generic form.",
    points: [
      { title: "Your own questions, per campaign", body: "Text or dropdown fields, mark any as required, in whatever order you want." },
      { title: "Forwarded, never stored", body: "Answers get the same treatment as name and phone - sent straight to you, never kept on Commission's side." },
      { title: "Small: 3, Medium: 5, Large: 8", body: "Every plan includes custom fields - higher plans simply allow more questions per campaign." },
    ],
  },
];

export const solutions = [
  {
    slug: "lead-generation",
    name: "Lead Generation",
    headline: "Generate Intent Qualified Leads without paying for every click",
    intro:
      "Instead of paying an ad platform for reach that may or may not convert, list a qualified-lead campaign on Commission and only pay once a lead is actually confirmed.",
    points: [
      { title: "Pay for outcomes, not clicks", body: "Nothing leaves your Campaign Wallet until a lead qualifies." },
      { title: "Built-in distribution", body: "Affiliates already active on Commission can start promoting your campaign the same day you list it." },
      { title: "Radar keeps leads clean", body: "Every lead is checked against the referring affiliate's real track record before it reaches you." },
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
      "Commission is built around one idea: you only pay when something actually happens - a Intent Qualified Lead or a verified sale - not for impressions, clicks, or reach.",
    points: [
      { title: "Outcome-based by design", body: "Every campaign is priced around a Intent Qualified Lead or a sale, never an impression." },
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
      { title: "Pay only for a genuine result", body: "A Intent Qualified Lead or a verified sale, never just reach." },
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
      { title: "Pay only for results in that market", body: "No fixed local marketing spend - you pay per Intent Qualified Lead or sale, wherever it comes from." },
      { title: "Scales as you grow", body: "Add more campaigns or cities without rebuilding your acquisition approach each time." },
    ],
  },
];

export const integrations = [
  {
    slug: "radar",
    name: "Radar",
    headline: "Radar is Commission's built-in affiliate trust layer",
    intro:
      "Radar is not a setting to configure - it runs on every lead-goal campaign automatically. It tracks each affiliate's real qualification history and decides, lead by lead, whether extra verification is needed before a prospect reaches you.",
    points: [
      { title: "On by default, for every business", body: "There is nothing to turn on or connect - Radar runs the moment a campaign goes live." },
      { title: "Invisible to trusted affiliates", body: "A proven affiliate's leads pass through exactly as fast as before Radar existed." },
      { title: "Learn more", body: "See the full breakdown of what Radar does and why it exists on its dedicated page." },
    ],
  },
  {
    slug: "email",
    name: "Email",
    headline: "Email is a native lead-forwarding destination",
    intro:
      "Every Intent Qualified Lead can be forwarded straight to an email address you set - no webhook, no third-party tool, no setup beyond adding the address on your Account page. This is on by default and works alongside a webhook if you add one too.",
    points: [
      { title: "Free for every business", body: "Email forwarding costs nothing extra and needs no setup beyond adding the address on your Account page." },
      { title: "Falls back automatically", body: "If no notification email is set, forwarding falls back to your account owner's email so a lead is never lost." },
      { title: "Full lead details included", body: "Name, phone, email, and any qualifying details are sent the moment a lead qualifies." },
    ],
  },
  {
    slug: "paystack",
    name: "Paystack",
    headline: "Every payment on Commission runs through Paystack",
    intro:
      "Paystack is not an add-on - it is the payment rail underneath the entire platform. Funding your Campaign Wallet, paying out affiliate commissions, and splitting a direct sale between you and your affiliate at checkout all run through Paystack automatically.",
    points: [
      { title: "Wallet top-ups", body: "Fund your Campaign Wallet directly via Paystack - the same top-up that triggers Commission's platform fee." },
      { title: "Affiliate payouts", body: "Commissions are paid out to affiliates' bank accounts via Paystack, automatically, once earned." },
      { title: "Split checkout for direct sales", body: "On sale-goal campaigns, Paystack splits the customer's payment between your business and the affiliate in the same transaction - no manual transfer." },
    ],
  },
  {
    slug: "excel",
    name: "Excel / CSV",
    headline: "Your leads become a spreadsheet in one click",
    intro:
      "Export your leads straight to CSV from the dashboard's Leads tab, and open it directly in Excel, Google Sheets, or any spreadsheet tool - no separate export tool, no reformatting.",
    points: [
      { title: "One-click CSV export", body: "From the Leads tab in your dashboard - opens cleanly in Excel or Google Sheets." },
      { title: "Free for every business", body: "Not a paid add-on - export is available the moment you have leads to export." },
      { title: "Full lead data, no PII surprises", body: "Includes everything already forwarded to you - nothing Commission itself stores beyond that." },
    ],
  },
  {
    slug: "native",
    name: "Native",
    headline: "Lead management is built in, not bolted on",
    intro:
      "Filtering, searching, and exporting your Intent Qualified Leads is not a separate integration to configure - it is a native part of every dashboard, free for every business. No API key, no webhook, no third-party tool to connect.",
    points: [
      { title: "Nothing to set up", body: "Lead management works the moment you have a campaign live - there is no connection step." },
      { title: "Filter, search, export", body: "Narrow your Intent Qualified Leads by status, campaign, or date, and export to CSV whenever you need the raw data." },
      { title: "Works alongside email forwarding", body: "Use lead management in your dashboard, and still get every lead forwarded to your email automatically too." },
    ],
  },
];
