"use client";

import { useRouter } from "next/navigation";
import { Box, Container, Typography, Button, Grid, Paper, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";
import { dotPatternSx, altSectionBg } from "@/lib/patterns";
import CardGridSection from "@/components/marketing/CardGridSection";
import ProblemSolutionSection from "@/components/marketing/ProblemSolutionSection";
import FAQ from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTAAndFooter";
import WhatsAppComparisonSection from "@/components/marketing/WhatsAppComparisonSection";
import SectionLabel from "@/components/marketing/SectionLabel";
import InboxDemoIllustration from "@/components/marketing/InboxDemoIllustration";
import InboxHeroDemo from "@/components/marketing/InboxHeroDemo";
import InboxJourneyMap from "@/components/marketing/InboxJourneyMap";
import PipelineStageExplorer from "@/components/marketing/InboxPipelineStageExplorer";
import { LeadRoutingDemo, TasksDemo, CsvImportDemo, MessageSearchDemo } from "@/components/marketing/InboxFeatureIllustrations";

const CRM_CHALLENGES = [
  {
    problem: "Most WhatsApp CRM integrations run through the official WhatsApp Business API, which cuts off free-form replies 24 hours after a customer's last message - after that, you're stuck sending pre-approved template messages until they message back.",
    solution: "Inbox connects like a normal WhatsApp account, not the template-gated Business API - reply to any conversation any time, no 24-hour cutoff.",
  },
  {
    problem: "The same API restriction means you can't message a new customer first - the official Business API requires them to contact you before you can send a free-form reply, or requires an approved template just to say hello.",
    solution: "Since Inbox works like your own WhatsApp, your team can start a new conversation with a customer whenever they need to - no waiting for them to message first.",
  },
  {
    problem: "Migrating a number to the official WhatsApp Business Platform usually means giving up the regular WhatsApp app on that number entirely - once it's on the API, you can't also use it to chat normally from a phone.",
    solution: "Inbox links the same way WhatsApp Web does. Scan a QR code and keep using WhatsApp on that phone exactly as before - nothing to uninstall, nothing to give up.",
  },
  {
    problem: "Most CRM integrations only work with an official WhatsApp Business Account (WABA) - a separate, formally verified account type, not the regular WhatsApp or WhatsApp Business app your team may already be using day to day.",
    solution: "Inbox connects a personal number, a regular WhatsApp Business app number, or a WABA - whichever your team is already using. No separate account type to apply for or verify.",
  },
];

const BENEFITS = [
  { title: "Customers reply where they already are", body: "No app to download, no portal to log into - just the chat app already on their phone, with your business as a saved contact." },
  { title: "Nothing falls through the cracks", body: "Every conversation is assigned, tracked, and visible to the whole team - not buried in one person's personal phone." },
  { title: "Turn chats into a real pipeline", body: "Convert any conversation into a lead with one click, move it through stages, and see what's actually closing." },
  { title: "Built for how your team actually works", body: "The familiar WhatsApp layout means zero training time - if your team can use WhatsApp, they can use Inbox." },
];

const FEATURES = [
  { title: "Shared team inbox", body: "Connect your business's WhatsApp number and let your whole team reply from one place, with every message visible to everyone." },
  { title: "Lead pipeline", body: "Convert a conversation into a lead in one click and track it through a Kanban pipeline from first message to close." },
  { title: "Smart lead routing", body: "New conversations get automatically assigned - round robin, by keyword, or to whoever's actually online right now." },
  { title: "Tasks & follow-ups", body: "Set a reminder tied to a specific chat so a promising conversation never goes cold." },
  { title: "CSV lead import", body: "Already have a list of contacts? Import them straight into your pipeline in a few clicks." },
  { title: "Full-text message search", body: "Find that one conversation about pricing from three weeks ago, across your entire inbox." },
];

const USE_CASES = [
  { title: "Real estate", body: "Answer inspection requests and price questions the moment they come in, from whichever agent is free - not just whoever owns the phone." },
  { title: "Retail & e-commerce", body: "Handle order questions, share product photos, and confirm payments in the same thread a customer already messaged you on." },
  { title: "Services & bookings", body: "Route new enquiries to the right team member automatically, and never lose track of who you promised to follow up with." },
];

const FAQ_ITEMS = [
  {
    q: "Do I need the official WhatsApp Business API?",
    a: "No - Inbox connects directly to a personal or business WhatsApp number the same way linking WhatsApp Web does, so there's no lengthy Business API approval process to go through.",
  },
  {
    q: "Can I still reply to a customer after 24 hours?",
    a: "Yes. The 24-hour reply window is a restriction of the official WhatsApp Business API, not of WhatsApp itself - since Inbox connects like a normal WhatsApp account, there's no cutoff on replying to an existing conversation, any time.",
  },
  {
    q: "Can I message a customer first, before they've messaged me?",
    a: "Yes - the official Business API requires a customer to message you first (or an approved template just to say hello). Inbox works like your own WhatsApp, so your team can start a new conversation whenever they need to.",
  },
  {
    q: "Can more than one person reply from the same number?",
    a: "Yes - that's the whole point. Add your team, and everyone can see and reply to conversations from one shared inbox, with each message showing which teammate sent it.",
  },
  {
    q: "Do I need to delete WhatsApp from my phone before using Inbox?",
    a: "No. Unlike migrating to the official WhatsApp Business Platform (which takes that number off the regular app entirely), Inbox links the same way WhatsApp Web does - scan a QR code and keep using WhatsApp on that phone exactly as before.",
  },
  {
    q: "Do I need an official WhatsApp Business Account (WABA)?",
    a: "No. Inbox connects a personal number, a regular WhatsApp Business app number, or a WABA if you already have one - whichever your team is already using, with no separate verified account type to apply for.",
  },
  {
    q: "How many WhatsApp numbers can we connect?",
    a: "It depends on your plan - see the pricing table below for exactly how many numbers and team seats are included at each tier.",
  },
];

export default function InboxPageContent() {
  const router = useRouter();

  return (
    <>
      {/* Hero */}
      <Box component="section" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 6, md: 8 }, bgcolor: tokens.paper }}>
        <Container maxWidth="md">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <SectionLabel>Inbox</SectionLabel>
              <Typography variant="h1" sx={{ fontSize: { xs: 32, md: 46 }, mb: 2.5, lineHeight: 1.15 }}>
                Turn your business WhatsApp into a team inbox that closes deals
              </Typography>
              <Typography variant="body1" sx={{ color: tokens.muted, fontSize: 18, mb: 4, maxWidth: 520 }}>
                Connect one WhatsApp number, add your whole team, and reply to every customer from a shared inbox
                with a built-in pipeline - no WhatsApp Business API, no separate app to learn.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button variant="contained" size="large" onClick={() => router.push("/signin?role=business")}>
                  Get started free
                </Button>
                <Button variant="outlined" size="large" onClick={() => document.getElementById("inbox-pricing")?.scrollIntoView({ behavior: "smooth" })}>
                  See pricing
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper variant="outlined" sx={{ borderRadius: 4, borderColor: tokens.border, bgcolor: "#F7F6F2", overflow: "hidden" }}>
                <InboxHeroDemo />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center", mb: 5 }}>
            <SectionLabel sx={{ justifyContent: "center" }}>See it in action</SectionLabel>
            <Typography variant="h3" sx={{ fontSize: { xs: 24, md: 30 }, mb: 1.5 }}>
              This is the real interface
            </Typography>
            <Typography variant="body1" sx={{ color: tokens.muted, maxWidth: 540, mx: "auto" }}>
              A customer messages your WhatsApp number. It lands in one shared inbox your whole team can see - anyone
              can reply, the conversation gets assigned, and read receipts work exactly like WhatsApp already does.
              Try it below: click a number tab, then click a customer.
            </Typography>
          </Box>

          <InboxDemoIllustration />

          <Grid container spacing={3} sx={{ mt: 1, maxWidth: 560, mx: "auto" }}>
            {[
              { title: "Pick a number, see who messaged it", body: "Businesses on Medium/Large can connect more than one line - tabs switch between each one's customer list." },
              { title: "Anyone on the team can reply", body: "Notice two different names sending replies - that's the whole point of a shared inbox." },
              { title: "Real delivery ticks", body: "Sent, delivered, read - the same indicators you already know from WhatsApp itself." },
            ].map((f) => (
              <Grid item xs={12} sm={4} key={f.title}>
                <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>{f.title}</Typography>
                <Typography variant="caption" sx={{ color: tokens.muted }}>{f.body}</Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <CardGridSection id="benefits" title="Why businesses switch to Inbox" items={BENEFITS} columns={2} bgcolor={altSectionBg} />

      <ProblemSolutionSection items={CRM_CHALLENGES} eyebrow="The official API's fine print" />

      <WhatsAppComparisonSection />

      <CardGridSection title="Everything you need to run support and sales on WhatsApp" items={FEATURES} columns={3} bgcolor={altSectionBg} />

      <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center", mb: 5 }}>
            <SectionLabel sx={{ justifyContent: "center" }}>How it actually works</SectionLabel>
            <Typography variant="h3" sx={{ fontSize: { xs: 24, md: 30 } }}>
              A closer look at the features above
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}><LeadRoutingDemo /></Grid>
            <Grid item xs={12} sm={6}><TasksDemo /></Grid>
            <Grid item xs={12} sm={6}><CsvImportDemo /></Grid>
            <Grid item xs={12} sm={6}><MessageSearchDemo /></Grid>
          </Grid>
        </Container>
      </Box>

      <CardGridSection title="Built for how you actually sell" items={USE_CASES} columns={3} />

      <Box component="section" sx={{ py: { xs: 6, md: 9 }, bgcolor: altSectionBg }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <SectionLabel sx={{ justifyContent: "center" }}>The full journey</SectionLabel>
            <Typography variant="h3" sx={{ fontSize: { xs: 24, md: 30 }, mb: 1.5 }}>
              From referral to Won, in one pipeline
            </Typography>
            <Typography variant="body1" sx={{ color: tokens.muted, maxWidth: 560, mx: "auto" }}>
              A lead doesn&apos;t have to start as a cold WhatsApp message - if you also run affiliate campaigns on
              Commission, this is what it looks like when that traffic turns into a real conversation your team can
              close.
            </Typography>
          </Box>

          <InboxJourneyMap />

          <PipelineStageExplorer />
        </Container>
      </Box>

      <Box id="inbox-pricing" sx={dotPatternSx}>
        <Box sx={{ py: { xs: 6, md: 9 } }}>
          <Container maxWidth="md" sx={{ textAlign: "center" }}>
            <Typography variant="h3" sx={{ fontSize: { xs: 24, md: 30 }, mb: 1.5 }}>
              Included on Medium and Large plans
            </Typography>
            <Typography variant="body1" sx={{ color: tokens.muted, mb: 4, maxWidth: 480, mx: "auto" }}>
              WhatsApp numbers and team seats scale with your plan - see the full breakdown on the pricing table.
            </Typography>
            <Button variant="contained" size="large" component="a" href="/#pricing">
              View pricing
            </Button>
          </Container>
        </Box>

        <FAQ items={FAQ_ITEMS} title="Inbox FAQ" />
      </Box>

      <CTASection
        content={{
          headline: "Reply to your customers where they already are",
          subhead: "Connect your WhatsApp number and get your team into a shared inbox in minutes.",
          primaryCta: "Get started free",
        }}
        onPrimaryCta={() => router.push("/signin?role=business")}
      />
    </>
  );
}
