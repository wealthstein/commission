import { notFound } from "next/navigation";
import { Box, Container, Typography } from "@mui/material";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { resolveLandingBranding } from "@/lib/branding";
import { requiresAffiliateContactSharing } from "@/lib/leadForwarding";
import { tokens } from "@/lib/theme";
import LeadLongForm from "@/components/marketing/LeadLongForm";

async function getLeadContext(whatsappRef) {
  const supabase = createAdminSupabaseClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("status, program_id, affiliate_programs(products(name, businesses(plan, industry, landing_logo_url, landing_primary_color)))")
    .eq("whatsapp_ref", whatsappRef)
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
  const lead = await getLeadContext(params.whatsappRef);
  if (!lead) notFound();
  if (lead.status !== "captured") {
    return (
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="sm">
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            This link has already been used
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            If you think this is a mistake, reach out to the business directly on WhatsApp.
          </Typography>
        </Container>
      </Box>
    );
  }

  const product = lead.affiliate_programs.products;
  const branding = resolveLandingBranding(product.businesses);
  const sharesContactWithAffiliate = requiresAffiliateContactSharing(product.businesses);

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, borderTop: branding.primaryColor ? `4px solid ${branding.primaryColor}` : "none" }}>
      <Container maxWidth="sm">
        {branding.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.logoUrl} alt="" style={{ height: 40, marginBottom: 24 }} />
        )}
        <LeadLongForm
          whatsappRef={params.whatsappRef}
          productName={product.name}
          customFields={lead.customFields}
          sharesContactWithAffiliate={sharesContactWithAffiliate}
        />
      </Container>
    </Box>
  );
}
