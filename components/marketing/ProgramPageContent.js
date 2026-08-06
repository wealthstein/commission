import Link from "next/link";
import { Box, Container, Typography, Chip, Stack, Avatar } from "@mui/material";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import { buildSeoTargetFaqJsonLd } from "@/lib/seo";
import SignUpButton from "@/components/marketing/SignUpButton";

/**
 * /programs/[industry]/[company] - the SUB-CHILD level under Programs.
 * Deliberately a narrower, centered "profile card" layout rather than the
 * wide list-style page one level up (/programs/[industry]) - this page is
 * about ONE specific company, so it reads more like a profile than a
 * browse page. Affiliate-only, confident recruiting tone throughout.
 */
export default function ProgramPageContent({ target, industry, liveProducts }) {
  const faqJsonLd = buildSeoTargetFaqJsonLd(target, liveProducts.length > 0);
  const initial = target.displayName.charAt(0).toUpperCase();

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <Container maxWidth="lg">
        <Box sx={{ maxWidth: 560, mx: "auto", textAlign: "center" }}>
        {industry && (
          <Typography variant="body2" sx={{ mb: 3 }}>
            <Typography component={Link} href={urls.programIndustry(industry.keywordSlug)} sx={{ color: tokens.muted, display: "inline" }}>
              {industry.displayName} programs
            </Typography>
            <Typography component="span" sx={{ color: tokens.muted, mx: 0.75 }}>
              /
            </Typography>
            <Typography component="span" sx={{ color: tokens.ink, fontWeight: 600, display: "inline" }}>
              {target.displayName}
            </Typography>
          </Typography>
        )}

        <Avatar sx={{ width: 72, height: 72, bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 800, fontSize: 30, mx: "auto", mb: 2.5 }}>
          {initial}
        </Avatar>

        <Chip label="For affiliates" size="small" sx={{ bgcolor: "#F7F6F2", fontWeight: 600, mb: 2 }} />

        <Typography variant="h1" sx={{ fontSize: { xs: 26, md: 34 }, mb: 2 }}>
          Does {target.displayName} have a program you can promote?
        </Typography>

        <Typography variant="body1" sx={{ color: tokens.muted, mb: 5, maxWidth: 480, mx: "auto" }}>
          Claim your affiliate account now, and the moment {target.displayName} - or a similar business in{" "}
          {industry ? industry.displayName.toLowerCase() : "this space"} - launches a program, you will be ready to
          promote it and start earning from day one.
        </Typography>

        <Box sx={{ maxWidth: 440, mx: "auto", mb: 6 }}>
          <SignUpButton role="affiliate" sourcePage={urls.program(target.routeSlug)} />
        </Box>

        {liveProducts.length > 0 ? (
          <>
            <Typography variant="body2" fontWeight={700} sx={{ mb: 2 }}>
              Live {target.industryCategory} programs you can promote right now
            </Typography>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" justifyContent="center" sx={{ mb: 3 }}>
              {liveProducts.map((p) => (
                <Chip
                  key={`${p.businesses.slug}-${p.slug}`}
                  component={Link}
                  href={urls.product(p.businesses.slug, p.slug)}
                  clickable
                  label={`${p.name} · ${p.businesses.name}`}
                  variant="outlined"
                  sx={{ borderColor: tokens.border, fontWeight: 600 }}
                />
              ))}
            </Stack>
          </>
        ) : (
          industry && (
            <Typography variant="body2" component={Link} href={urls.programIndustry(industry.keywordSlug)} sx={{ color: tokens.ink, fontWeight: 600 }}>
              Browse live {industry.displayName} programs →
            </Typography>
          )
        )}
        </Box>
      </Container>
    </Box>
  );
}
