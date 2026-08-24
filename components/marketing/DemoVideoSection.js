import { Box, Container, Typography } from "@mui/material";
import { tokens } from "@/lib/theme";
import ConvergingFlowDiagram from "@/components/marketing/ConvergingFlowDiagram";

/**
 * Renders right after HowItWorks on the homepage, one per audience.
 *
 * Default state is ConvergingFlowDiagram.js - adapted from a reference
 * video showing multiple weighted inputs flowing into a central engine,
 * then out to a single decision. For businesses, the inputs are Radar's
 * actual trust signals; for affiliates, the multi-tier earning structure.
 * This is genuinely built, not a placeholder waiting on something else -
 * Claude cannot produce actual video files, so this replaces that need
 * entirely rather than standing in for it.
 *
 * If a real recorded video is ever produced anyway, pass its embed URL as
 * videoUrl and it takes priority over the diagram.
 */
const FLOW_DATA = {
  business: {
    nodes: [
      { percent: "40%", label: "Affiliate Trust Score" },
      { percent: "25%", label: "Form-Fill Timing" },
      { percent: "20%", label: "Cross-Campaign Signals" },
      { percent: "15%", label: "Network Plausibility" },
    ],
    engineLabel: "Radar Engine",
    decisionLabel: "Qualified Lead",
  },
  affiliate: {
    nodes: [
      { percent: "50%", label: "Your Direct Referrals" },
      { percent: "30%", label: "Tier-2 Recruits" },
      { percent: "20%", label: "Tier-3 Recruits" },
    ],
    engineLabel: "Commission Engine",
    decisionLabel: "Automatic Payout",
  },
};

export default function DemoVideoSection({ audience, videoUrl, bgcolor }) {
  const title = audience === "business" ? "See how Radar protects your leads" : "See how you get paid";
  const subtitle =
    audience === "business"
      ? "What happens the moment a lead comes in - checked, verified, and delivered automatically."
      : "What happens the moment someone clicks your link - tracked, qualified, and paid automatically.";
  const flow = FLOW_DATA[audience] || FLOW_DATA.business;

  return (
    <Box component="section" sx={{ py: { xs: 6, md: 9 }, bgcolor }}>
      <Container maxWidth="md" sx={{ textAlign: "center" }}>
        <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 30 }, fontWeight: 700, mb: 1 }}>
          {title}
        </Typography>
        <Typography sx={{ color: tokens.muted, mb: 4 }}>{subtitle}</Typography>

        {videoUrl ? (
          <Box sx={{ position: "relative", pt: "56.25%", borderRadius: 3, overflow: "hidden", bgcolor: "#000" }}>
            <Box
              component="iframe"
              src={videoUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            />
          </Box>
        ) : (
          <ConvergingFlowDiagram nodes={flow.nodes} engineLabel={flow.engineLabel} decisionLabel={flow.decisionLabel} />
        )}
      </Container>
    </Box>
  );
}
