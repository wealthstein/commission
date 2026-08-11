import { notFound } from "next/navigation";
import { Box, Container, Typography, Stack, Divider, Avatar, Grid } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { resolveLandingBranding } from "@/lib/branding";
import { requiresAffiliateContactSharing } from "@/lib/leadForwarding";
import { billingLabel } from "@/lib/seo";
import { tokens } from "@/lib/theme";
import LeadLongForm from "@/components/marketing/LeadLongForm";

const LETTER_COLORS = ["#FFE280", "#C7E8D8", "#F3C6C6", "#C9D9F2", "#F2DCC9", "#D9C9F2"];
function colorForString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return LETTER_COLORS[Math.abs(hash) % LETTER_COLORS.length];
}
function randomLetterColor() {
  return LETTER_COLORS[Math.floor(Math.random() * LETTER_COLORS.length)];
}

async function getLeadContext(leadRef) {
  const supabase = createAdminSupabaseClient();
  // Full "*" selects on product/business - same shape the product page
  // (Interest Form) already fetches, needed to replicate the identical
  // left-panel business/price summary here.
  const { data: lead } = await supabase
    .from("leads")
    .select("status, program_id, affiliate_programs(*, products(*, businesses(*)))")
    .eq("lead_ref", leadRef)
    .maybeSingle();
  if (!lead) return null;

  const { data: customFields } = await supabase
    .from("campaign_custom_fields")
    .select("id, label, field_type, options, required, display_order")
    .eq("affiliate_program_id", lead.program_id)
    .order("display_order", { ascending: true });

  return { ...lead, customFields: customFields || [] };
}

export default async function LeadContinuePage({ params }) {
  const lead = await getLeadContext(params.leadRef);
  if (!lead) notFound();

  const program = lead.affiliate_programs;
  const product = program.products;
  const business = product.businesses;
  const branding = resolveLandingBranding(business);
  const sharesContactWithAffiliate = requiresAffiliateContactSharing(business);

  if (lead.status !== "captured") {
    return (
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="sm">
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            This link has already been used
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            If you think this is a mistake, reach out to the business directly.
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
      <Grid container sx={{ minHeight: "100vh" }}>
        <Grid item xs={12} md={6} sx={{ bgcolor: "#FAFAF8", borderRight: { md: `1px solid ${tokens.border}` } }}>
            <Box sx={{ px: { xs: 4, md: "150px" }, py: { xs: 4, md: 8 } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 5 }}>
              <Box component={Link} href="/" sx={{ color: tokens.muted, display: "flex", alignItems: "center", mr: 0.5 }} aria-label="Back">
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
              <LeadLongForm
                leadRef={params.leadRef}
                businessName={business.name}
                logoUrl={branding.logoUrl}
                customFields={lead.customFields}
                sharesContactWithAffiliate={sharesContactWithAffiliate}
              />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}