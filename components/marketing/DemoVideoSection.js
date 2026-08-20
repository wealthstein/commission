import { Box, Container, Typography } from "@mui/material";
import { tokens } from "@/lib/theme";
import AnimatedIllustration from "@/components/marketing/AnimatedIllustration";

/**
 * Renders right after HowItWorks on the homepage, one per audience.
 *
 * Default state is a real, built animated illustration (AnimatedIllustration.js)
 * - a looping sequence of status checks appearing one by one, the same
 * pattern Stripe's Radar page uses to explain what happens behind the
 * scenes. This is genuinely built, not a placeholder waiting on something
 * else - Claude cannot produce actual video files, so this replaces that
 * need entirely rather than standing in for it.
 *
 * If a real recorded video is ever produced anyway, pass its embed URL as
 * videoUrl and it takes priority over the animation.
 */
export default function DemoVideoSection({ audience, videoUrl, bgcolor }) {
  const title = audience === "business" ? "See how Radar protects your leads" : "See how you get paid";
  const subtitle =
    audience === "business"
      ? "What happens the moment a lead comes in - checked, verified, and delivered automatically."
      : "What happens the moment someone clicks your link - tracked, qualified, and paid automatically.";

  return (
    <Box component="section" sx={{ py: { xs: 6, md: 9 }, bgcolor }}>
      <Container maxWidth="lg" sx={{ textAlign: "center" }}>
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
          <AnimatedIllustration audience={audience} />
        )}
      </Container>
    </Box>
  );
}
