import { notFound } from "next/navigation";
import { Box, Container, Typography, Chip, Stack, Button, Grid, Paper } from "@mui/material";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { buildProductMetadata, buildProductJsonLd, buildBreadcrumbJsonLd, billingLabel, SITE_URL } from "@/lib/seo";
import { tokens } from "@/lib/theme";
import Link from "next/link";

// ISR: pages regenerate in the background at most once an hour rather than
// on every request, which is what makes hundreds of thousands of these
// pages cheap to serve. New products call POST /api/revalidate to bust this
// early instead of waiting out the full hour.
export const revalidate = 3600;

// Returning an empty array + leaving dynamicParams at its default (true)
// means: don't try to pre-render all of them at build time (impossible at
// this scale), but happily render+cache any slug pair on first request.
// Swap in your highest-traffic products here if you want a handful
// pre-built at deploy time.
export async function generateStaticParams() {
  return [];
}

async function getProductAndBusiness(businessSlug, productSlug) {
  const supabase = createAdminSupabaseClient();
  const { data: business } = await supabase.from("businesses").select("*").eq("slug", businessSlug).maybeSingle();
  if (!business) return { business: null, product: null, program: null };

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", business.id)
    .eq("slug", productSlug)
    .eq("status", "active")
    .maybeSingle();
  if (!product) return { business, product: null, program: null };

  const { data: program } = await supabase
    .from("affiliate_programs")
    .select("*")
    .eq("product_id", product.id)
    .eq("status", "active")
    .maybeSingle();

  return { business, product, program };
}

export async function generateMetadata({ params }) {
  const { business, product } = await getProductAndBusiness(params.businessSlug, params.productSlug);
  if (!business || !product) return { title: "Product not found | Commission" };
  return buildProductMetadata({ product, business });
}

export default async function ProductPage({ params }) {
  const { business, product, program } = await getProductAndBusiness(params.businessSlug, params.productSlug);
  if (!business || !product) notFound();

  const jsonLd = buildProductJsonLd({ product, business });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: SITE_URL },
    { name: business.name, url: `${SITE_URL}/businesses/${business.slug}` },
    { name: product.name, url: `${SITE_URL}/products/${business.slug}/${product.slug}` },
  ]);

  return (
    <Box sx={{ py: { xs: 6, md: 9 } }}>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <Container maxWidth="md">
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="body2" component={Link} href="/" sx={{ color: tokens.muted }}>
            Commission
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            /
          </Typography>
          <Typography variant="body2" component={Link} href={`/businesses/${business.slug}`} sx={{ color: tokens.muted }}>
            {business.name}
          </Typography>
        </Stack>

        {product.category && <Chip label={product.category} size="small" sx={{ bgcolor: "#F1EFE7", fontWeight: 600, mb: 2, mr: 1 }} />}
        <Chip
          label={product.product_type === "physical" ? "Physical Product" : "Digital Product"}
          size="small"
          variant="outlined"
          sx={{ mb: 2 }}
        />

        <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 42 }, mb: 2 }}>
          {product.name} Affiliate Program
        </Typography>

        <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 4, maxWidth: 640 }}>
          Promote {product.name} by {business.name} on Commission and earn commission on every referred sale.
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={4}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: tokens.border }}>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                Price
              </Typography>
              <Typography fontWeight={700}>
                ₦{Number(product.price_naira).toLocaleString()} {billingLabel(product.billing_frequency)}
              </Typography>
            </Paper>
          </Grid>
          {program && (
            <Grid item xs={6} sm={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: tokens.border }}>
                <Typography variant="caption" sx={{ color: tokens.muted }}>
                  Tier 1 commission
                </Typography>
                <Typography fontWeight={700}>{program.tier1_percent}%</Typography>
              </Paper>
            </Grid>
          )}
          {program && (
            <Grid item xs={6} sm={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: tokens.border }}>
                <Typography variant="caption" sx={{ color: tokens.muted }}>
                  Commission type
                </Typography>
                <Typography fontWeight={700} sx={{ textTransform: "capitalize" }}>
                  {program.commission_type.replace("_", "-")}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>

        {product.description && (
          <Typography variant="body1" sx={{ color: tokens.muted, mb: 4 }}>
            {product.description}
          </Typography>
        )}

        {product.product_type === "physical" && product.offline_payment_instructions && (
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: tokens.border, mb: 4, bgcolor: "#F1EFE7" }}>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 700, display: "block", mb: 0.5 }}>
              HOW TO BUY
            </Typography>
            <Typography variant="body2">{product.offline_payment_instructions}</Typography>
          </Paper>
        )}

        <Button variant="contained" size="large" component={Link} href={`/?join=${product.id}`}>
          Join this affiliate program
        </Button>
      </Container>
    </Box>
  );
}
