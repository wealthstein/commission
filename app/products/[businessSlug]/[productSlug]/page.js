import { notFound } from "next/navigation";
import { Box, Container, Typography, Chip, Stack, Button, Grid, Paper, Divider, Avatar } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { buildProductMetadata, buildProductJsonLd, buildBreadcrumbJsonLd, billingLabel, SITE_URL } from "@/lib/seo";
import { resolveLandingBranding } from "@/lib/branding";
import { tokens } from "@/lib/theme";
import Link from "next/link";
import LeadShortForm from "@/components/marketing/LeadShortForm";

// Deterministic color from a string - same business/product always gets
// the same color, without needing a real uploaded image. Palette pulled
// from the brand's existing supplement colors so it never looks random or
// off-brand.
const LETTER_COLORS = ["#FFE280", "#C7E8D8", "#F3C6C6", "#C9D9F2", "#F2DCC9", "#D9C9F2"];
// Business identity (header) stays visually consistent across visits.
function colorForString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return LETTER_COLORS[Math.abs(hash) % LETTER_COLORS.length];
}
// The campaign line-item specifically gets a fresh random color on every
// page load, not tied to the business's logo at all - a campaign has no
// image of its own, and this shouldn't inherit the business's branding.
function randomLetterColor() {
  return LETTER_COLORS[Math.floor(Math.random() * LETTER_COLORS.length)];
}

// This page used to be ISR-cached (revalidate = 3600) since business/product
// slugs rarely change. That's no longer possible: detecting a customer vs.
// affiliate visit reads searchParams.ref, which differs on every single
// request - Next.js correctly refuses to statically cache a page that
// depends on a per-request value (this is exactly what the
// DYNAMIC_SERVER_USAGE error means). Forcing dynamic rendering here is the
// real fix, not a workaround - there is no way to keep ISR caching while
// this page needs to branch on a query param.
export const dynamic = "force-dynamic";

// Returning an empty array + leaving dynamicParams at its default (true)
// means: do not try to pre-render all of them at build time (impossible at
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

export async function generateMetadata({ params, searchParams }) {
  const { business, product } = await getProductAndBusiness(params.businessSlug, params.productSlug);
  if (!business || !product) return { title: "Product not found • Commission" };
  return buildProductMetadata({ product, business, isCustomerVisit: !!searchParams?.ref });
}

export default async function ProductPage({ params, searchParams }) {
  const { business, product, program } = await getProductAndBusiness(params.businessSlug, params.productSlug);
  if (!business || !product) notFound();

  // A ref param means this visitor came from an affiliate's link - they're
  // a prospective CUSTOMER, not someone considering becoming an affiliate.
  // Those two audiences need genuinely different copy: a customer clicking
  // a GTBank loan link should never see "Affiliate Program" or "earn
  // commission on every referred sale" - that's confusing at best, and
  // reads as a scam at worst. Without a ref param, this is someone
  // browsing the program itself (from Discover, or the business's own
  // preview), where the affiliate-facing framing is exactly right.
  const isCustomerVisit = !!searchParams?.ref;
  const branding = resolveLandingBranding(business);

  const jsonLd = buildProductJsonLd({ product, business });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: SITE_URL },
    { name: business.name, url: `${SITE_URL}/businesses/${business.slug}` },
    { name: product.name, url: `${SITE_URL}/products/${business.slug}/${product.slug}` },
  ]);
  const jsonLdScripts = (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    </>
  );

  // Customers get a genuinely different layout, not just different copy -
  // a checkout-style two-column page (business summary + price on the
  // left, the actual form on the right) reads as a real business
  // transaction, not as an affiliate recruitment pitch. Affiliates
  // browsing the program itself (no ref param) keep the original
  // single-column program-overview layout, which is the right frame for
  // "am I going to promote this."
  if (isCustomerVisit) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
        {jsonLdScripts}
        <Grid container sx={{ minHeight: "100vh" }}>
          <Grid item xs={12} md={6} sx={{ bgcolor: "#FAFAF8", borderRight: { md: `1px solid ${tokens.border}` } }}>
            <Box sx={{ px: { xs: 4, md: "150px" }, py: { xs: 4, md: 8 } }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 5 }}>
                <Box
                  component={Link}
                  href="/"
                  sx={{ color: tokens.muted, display: "flex", alignItems: "center", mr: 0.5 }}
                  aria-label="Back"
                >
                  <ArrowBackRoundedIcon fontSize="small" />
                </Box>
                {branding.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={branding.logoUrl} alt={business.name} style={{ height: 32, width: 32, borderRadius: 6, objectFit: "cover" }} />
                ) : (
                  <Avatar sx={{ width: 32, height: 32, bgcolor: colorForString(business.name || business.id), color: tokens.ink, fontWeight: 700, fontSize: 14 }}>
                    {(business.name || "?").charAt(0).toUpperCase()}
                  </Avatar>
                )}
                <Typography fontWeight={700}>{business.name}</Typography>
              </Stack>

              <Typography variant="body2" sx={{ color: tokens.muted, mb: 0.5 }}>
                Pay {business.name}
              </Typography>
              <Typography variant="h3" fontWeight={800} sx={{ mb: 4 }}>
                ₦{Number(product.price_naira).toLocaleString()}
              </Typography>

              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: randomLetterColor(),
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      overflow: "hidden",
                    }}
                  >
                    <Typography variant="body2" sx={{ color: tokens.ink, fontWeight: 700 }}>
                      {(product.name || "?").charAt(0).toUpperCase()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography fontWeight={700}>{product.name}</Typography>
                    <Typography variant="caption" sx={{ color: tokens.muted }}>
                      {billingLabel(product.billing_frequency)}
                    </Typography>
                  </Box>
                </Stack>
                <Typography fontWeight={700}>₦{Number(product.price_naira).toLocaleString()}</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 4 }}>
                <Typography fontWeight={700}>Total</Typography>
                <Typography fontWeight={700}>₦{Number(product.price_naira).toLocaleString()}</Typography>
              </Stack>

              {product.description && (
                <Typography variant="body2" sx={{ color: tokens.muted, mb: 3 }}>
                  {product.description}
                </Typography>
              )}

              {/* Only meaningful for sale-goal campaigns - a lead-goal
                  campaign has nothing being purchased on this page at
                  all, the whole point is capturing the lead, so payment
                  instructions here would be confusing, not helpful. */}
              {program?.conversion_goal !== "lead" && product.offline_payment_instructions && (
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: tokens.border, bgcolor: "#fff" }}>
                  <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 700, display: "block", mb: 0.5 }}>
                    HOW TO BUY
                  </Typography>
                  <Typography variant="body2">{product.offline_payment_instructions}</Typography>
                </Paper>
              )}

              <Stack direction="row" spacing={2} sx={{ mt: 6 }}>
                <Typography variant="caption" sx={{ color: tokens.muted }}>
                  Powered by{" "}
                  <Typography component={Link} href="/" variant="caption" sx={{ color: tokens.muted, fontWeight: 700, textDecoration: "none" }}>
                    Commission
                  </Typography>
                </Typography>
                <Typography component={Link} href="/corporate/terms" variant="caption" sx={{ color: tokens.muted, textDecoration: "none" }}>
                  Terms
                </Typography>
                <Typography component={Link} href="/corporate/privacy" variant="caption" sx={{ color: tokens.muted, textDecoration: "none" }}>
                  Privacy
                </Typography>
              </Stack>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ px: { xs: 4, md: "150px" }, py: { xs: 4, md: 8 }, display: "flex", flexDirection: "column", minHeight: "100%" }}>
              <Box sx={{ flexGrow: 1 }}>
                {program?.conversion_goal === "lead" ? (
                  <LeadShortForm programId={program.id} productName={product.name} businessName={business.name} logoUrl={branding.logoUrl} checkoutStyle />
                ) : (
                  // Sale-goal customers normally never see this page at all -
                  // /r/[code] redirects them straight to Paystack checkout.
                  // Landing here with a ref param means that checkout attempt
                  // already failed once, so this retries through the same
                  // real entry point rather than linking to a dedicated
                  // checkout page that doesn't exist.
                  <Button variant="contained" size="large" fullWidth component={Link} href={`/r/${searchParams.ref}`} sx={{ py: 1.5, bgcolor: tokens.ink, "&:hover": { bgcolor: tokens.ink } }}>
                    Buy now
                  </Button>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 6, md: 9 } }}>
      {jsonLdScripts}

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

        {branding.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.logoUrl} alt={business.name} style={{ height: 44, marginBottom: 20 }} />
        )}

        {product.category && <Chip label={product.category} size="small" sx={{ bgcolor: "#F7F6F2", fontWeight: 600, mb: 2, mr: 1 }} />}
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

        {product.offline_payment_instructions && (
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: tokens.border, mb: 4, bgcolor: "#F7F6F2" }}>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 700, display: "block", mb: 0.5 }}>
              HOW TO BUY
            </Typography>
            <Typography variant="body2">{product.offline_payment_instructions}</Typography>
          </Paper>
        )}

        {program?.conversion_goal === "lead" ? (
          <LeadShortForm programId={program.id} productName={product.name} />
        ) : (
          <Button variant="contained" size="large" component={Link} href={`/products/${business.slug}/${product.slug}/join`}>
            Join this affiliate program
          </Button>
        )}
      </Container>
    </Box>
  );
}