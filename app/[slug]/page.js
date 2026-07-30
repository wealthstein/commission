import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Box, Container, Typography, Chip, Grid, Paper, Stack } from "@mui/material";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { parseSeoRouteSlug, buildSeoTargetMetadata, buildSeoTargetFaqJsonLd } from "@/lib/seo";
import { tokens } from "@/lib/theme";
import NotifyMeForm from "@/components/marketing/NotifyMeForm";

// ISR — see app/products/[businessSlug]/[productSlug]/page.js for why.
export const revalidate = 3600;

// Pre-render nothing at build time; every seo_keyword_targets row renders
// on first request and is cached for an hour. Rows are curated (see
// supabase/seed_seo_targets.sql) — this route does NOT invent a page for
// an arbitrary slug that isn't backed by a real row (see the 404 below).
export async function generateStaticParams() {
  return [];
}

async function getTarget(slug) {
  const parsed = parseSeoRouteSlug(slug);
  if (!parsed) return { parsed: null, target: null, liveProducts: [] };

  const supabase = createAdminSupabaseClient();
  const { data: target } = await supabase.from("seo_keyword_targets").select("*").eq("route_slug", slug).maybeSingle();
  if (!target) return { parsed, target: null, liveProducts: [] };

  let liveProducts = [];
  if (target.industry_category) {
    const { data } = await supabase
      .from("products")
      .select("name, slug, price_naira, businesses(name, slug)")
      .eq("category", target.industry_category)
      .eq("status", "active")
      .limit(6);
    liveProducts = data || [];
  }

  return { parsed, target, liveProducts };
}

export async function generateMetadata({ params }) {
  const { target } = await getTarget(params.slug);
  if (!target) return { title: "Not found | Commission" };
  return buildSeoTargetMetadata(target);
}

export default async function SeoKeywordTargetPage({ params }) {
  const { parsed, target, liveProducts } = await getTarget(params.slug);

  // Not one of our two URL patterns at all — a normal 404, not a fabricated page.
  if (!parsed) notFound();

  // Pattern matches, but there's no curated row for it — still a 404. This
  // route only ever renders slugs that were deliberately seeded (see
  // supabase/seed_seo_targets.sql), never arbitrary user-typed strings.
  if (!target) notFound();

  // Once a real business matching this identity joins Commission, the row
  // gets claimed_business_slug set and this page permanently redirects to
  // the real, live business page instead of the placeholder.
  if (target.claimed_business_slug) {
    redirect(`/businesses/${target.claimed_business_slug}`);
  }

  const faqJsonLd = buildSeoTargetFaqJsonLd(target, liveProducts.length > 0);
  const isCompany = target.type === "company";

  return (
    <Box sx={{ py: { xs: 6, md: 9 } }}>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <Container maxWidth="md">
        {target.industry_category && (
          <Chip label={target.industry_category} size="small" sx={{ bgcolor: "#F1EFE7", fontWeight: 600, mb: 2 }} />
        )}

        <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
          {isCompany ? `Does ${target.display_name} have an affiliate program?` : `${target.display_name} Affiliate Programs in Nigeria`}
        </Typography>

        <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5, maxWidth: 640 }}>
          {isCompany
            ? `${target.display_name} isn't currently listed on Commission. Get notified the moment they — or a similar business — launch an affiliate program here, and browse live programs in the meantime.`
            : `Commission tracks affiliate programs from Nigerian businesses in ${target.display_name}. Browse what's currently live, or get notified as more launch.`}
        </Typography>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 5 }}>
          <Typography fontWeight={700} sx={{ mb: 1 }}>
            Get notified
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
            {isCompany
              ? `We'll email you the moment ${target.display_name} — or another ${target.industry_category || "similar"} business — launches an affiliate program on Commission.`
              : `We'll email you as new ${target.display_name} affiliate programs go live.`}
          </Typography>
          <NotifyMeForm routeSlug={target.route_slug} />
        </Paper>

        {liveProducts.length > 0 && (
          <>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
              Live {target.industry_category} affiliate programs right now
            </Typography>
            <Grid container spacing={2.5}>
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
          <Stack spacing={1}>
            <Typography variant="body2" sx={{ color: tokens.muted }}>
              Nothing live in this space on Commission yet — be the first to know when that changes.
            </Typography>
            <Typography variant="body2" component={Link} href="/dashboard/discover" sx={{ color: tokens.ink, fontWeight: 600 }}>
              Browse all live affiliate programs →
            </Typography>
          </Stack>
        )}
      </Container>
    </Box>
  );
}
