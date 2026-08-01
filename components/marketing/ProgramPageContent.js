import Link from "next/link";
import { Box, Container, Typography, Chip, Grid, Paper, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";
import { buildSeoTargetFaqJsonLd } from "@/lib/seo";
import NotifyMeForm from "@/components/marketing/NotifyMeForm";
import RequestAccountForm from "@/components/marketing/RequestAccountForm";

export default function ProgramPageContent({ target, liveProducts }) {
  const faqJsonLd = buildSeoTargetFaqJsonLd(target, liveProducts.length > 0);
  const isCompany = target.type === "company";

  return (
    <Box sx={{ py: { xs: 6, md: 9 } }}>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <Container maxWidth="lg">
        {target.industry_category && (
          <Chip label={target.industry_category} size="small" sx={{ bgcolor: "#F1EFE7", fontWeight: 600, mb: 2 }} />
        )}

        <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
          {isCompany ? `Does ${target.display_name} have a program on Commission?` : `${target.display_name} Programs in Nigeria`}
        </Typography>

        <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5, maxWidth: 640 }}>
          {isCompany
            ? `${target.display_name} is not currently listed on Commission. Request early access and we will notify you the moment they - or a similar business - launch a program here.`
            : `Commission tracks programs from Nigerian businesses in ${target.display_name}. Browse what is currently live, or request early access as more launch.`}
        </Typography>

        <Box sx={{ mb: 5 }}>
          <RequestAccountForm sourcePage={`/programs/${target.route_slug}`} />
        </Box>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 5 }}>
          <Typography fontWeight={700} sx={{ mb: 1 }}>
            Get notified by email only
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
            Prefer just an email update instead of requesting an account right now? Leave your email below.
          </Typography>
          <NotifyMeForm routeSlug={target.route_slug} />
        </Paper>

        {liveProducts.length > 0 && (
          <>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
              Live {target.industry_category} programs right now
            </Typography>
            <Grid container spacing={2.5} sx={{ mb: 5 }}>
              {liveProducts.map((p) => (
                <Grid item xs={12} sm={6} key={`${p.businesses.slug}-${p.slug}`}>
                  <Paper
                    component={Link}
                    href={`/products/${p.businesses.slug}/${p.slug}`}
                    variant="outlined"
                    sx={{ display: "block", p: 3, borderRadius: 3, borderColor: tokens.border, "&:hover": { borderColor: tokens.ink } }}
                  >
                    <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                      {p.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: tokens.muted }}>
                      {p.businesses.name} · ₦{Number(p.price_naira).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {liveProducts.length === 0 && (
          <Stack spacing={1} sx={{ mb: 5 }}>
            <Typography variant="body2" sx={{ color: tokens.muted }}>
              Nothing live in this space on Commission yet - be the first to know when that changes.
            </Typography>
            <Typography variant="body2" component={Link} href="/programs" sx={{ color: tokens.ink, fontWeight: 600 }}>
              Browse all programs →
            </Typography>
          </Stack>
        )}

      </Container>
    </Box>
  );
}
