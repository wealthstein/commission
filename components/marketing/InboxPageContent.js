"use client";

import { useRouter } from "next/navigation";
import { Box, Container, Typography, Button, Grid, Paper, Stack } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { tokens } from "@/lib/theme";
import { dotPatternSx, altSectionBg } from "@/lib/patterns";
import CardGridSection from "@/components/marketing/CardGridSection";
import FAQ from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTAAndFooter";
import WhatsAppComparisonSection from "@/components/marketing/WhatsAppComparisonSection";
import SectionLabel from "@/components/marketing/SectionLabel";

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
    q: "Can more than one person reply from the same number?",
    a: "Yes - that's the whole point. Add your team, and everyone can see and reply to conversations from one shared inbox, with each message showing which teammate sent it.",
  },
  {
    q: "Will this replace our number's normal WhatsApp app?",
    a: "The connected number works like it's linked to WhatsApp Web - your team replies from Inbox, and conversations stay in sync.",
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
      <Box component="section" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 6, md: 8 } }}>
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
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, borderColor: tokens.border, bgcolor: "#F7F6F2" }}>
                <Stack spacing={2}>
                  {[
                    { icon: GroupsRoundedIcon, title: "Whole team, one inbox", body: "Every teammate sees every conversation" },
                    { icon: BoltRoundedIcon, title: "Instant routing", body: "New chats assigned the moment they land" },
                    { icon: CheckRoundedIcon, title: "Built-in pipeline", body: "Chats become leads with one click" },
                  ].map((f) => (
                    <Stack key={f.title} direction="row" spacing={1.5} alignItems="flex-start">
                      <Box sx={{ bgcolor: tokens.brand, borderRadius: 2, p: 1, display: "flex" }}>
                        <f.icon sx={{ fontSize: 20, color: tokens.brandInk }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{f.title}</Typography>
                        <Typography variant="caption" sx={{ color: tokens.muted }}>{f.body}</Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <CardGridSection id="benefits" title="Why businesses switch to Inbox" items={BENEFITS} columns={2} bgcolor={altSectionBg} />

      <WhatsAppComparisonSection />

      <CardGridSection title="Everything you need to run support and sales on WhatsApp" items={FEATURES} columns={3} bgcolor={altSectionBg} />

      <CardGridSection title="Built for how you actually sell" items={USE_CASES} columns={3} />

      <Box id="inbox-pricing" sx={dotPatternSx}>
        <Box sx={{ py: { xs: 6, md: 9 } }}>
          <Container maxWidth="md" sx={{ textAlign: "center" }}>
            <Typography variant="h3" sx={{ fontSize: { xs: 24, md: 30 }, mb: 1.5 }}>
              Inbox is included with every Commission plan
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
