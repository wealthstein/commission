import Link from "next/link";
import { Box, Container, Typography, Stack } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import { industryPages } from "@/lib/industryPages";
import { buildIndustriesIndexMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";

export const metadata = buildIndustriesIndexMetadata();

export default function IndustriesIndexPage() {
  const maxPpql = Math.max(...industryPages.map((p) => p.ppqlNaira));
  const sorted = [...industryPages].sort((a, b) => b.ppqlNaira - a.ppqlNaira);

  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="md">
          <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 42 }, mb: 2 }}>
            Affiliate marketing by industry
          </Typography>
          <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 6, maxWidth: 640 }}>
            What a Intent Qualified Lead typically costs, by industry - highest to lowest.
          </Typography>

          <Stack spacing={0} sx={{ border: `1px solid ${tokens.border}`, borderRadius: 3, overflow: "hidden" }}>
            {sorted.map((p, i) => {
              const barWidth = (p.ppqlNaira / maxPpql) * 100;
              return (
                <Box
                  key={p.slug}
                  component={Link}
                  href={urls.industry(p.slug)}
                  sx={{
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                    borderTop: i === 0 ? "none" : `1px solid ${tokens.border}`,
                    px: 3,
                    py: 2.5,
                    position: "relative",
                    "&:hover": { bgcolor: "#FAFAF8" },
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${barWidth}%`,
                      bgcolor: "#F7F6F2",
                      zIndex: 0,
                    }}
                  />
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ position: "relative", zIndex: 1 }}>
                    <Box>
                      <Typography fontWeight={700}>{p.industryName}</Typography>
                      <Typography variant="body2" sx={{ color: tokens.muted }}>
                        {p.headline}
                      </Typography>
                    </Box>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexShrink: 0, ml: 2 }}>
                      <Typography fontWeight={700} sx={{ whiteSpace: "nowrap" }}>
                        ₦{p.ppqlNaira.toLocaleString()}
                      </Typography>
                      <ArrowForwardRoundedIcon sx={{ color: tokens.muted, fontSize: 18 }} />
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
          </Stack>

          <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mt: 2 }}>
            Typical cost per Intent Qualified Lead - a business sets its own amount per campaign.
          </Typography>
        </Container>
      </Box>
    </MarketingPageShell>
  );
}
