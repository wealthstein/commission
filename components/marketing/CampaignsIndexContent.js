import Link from "next/link";
import { Container, Typography, Stack, Box } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { tokens } from "@/lib/theme";

export default function CampaignsIndexContent({ title, description, buildHref, items, relatedLinks }) {
  return (
    <Container maxWidth="md">
      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
        {title}
      </Typography>
      <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5, maxWidth: 640 }}>
        {description}
      </Typography>

      <Stack spacing={0} sx={{ border: `1px solid ${tokens.border}`, borderRadius: 3, overflow: "hidden", mb: relatedLinks?.length ? 6 : 0 }}>
        {items.map((item, i) => (
          <Box
            key={item.slug}
            component={Link}
            href={buildHref(item.slug)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 3,
              px: 3,
              py: 2.75,
              borderTop: i === 0 ? "none" : `1px solid ${tokens.border}`,
              textDecoration: "none",
              color: "inherit",
              "&:hover": { bgcolor: "#FAFAF8" },
            }}
          >
            <Box sx={{ minWidth: { sm: 220 } }}>
              <Typography fontWeight={700}>{item.name}</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: tokens.muted, flex: 1, display: { xs: "none", sm: "block" } }}>
              {item.headline}
            </Typography>
            <ArrowForwardRoundedIcon sx={{ color: tokens.muted, flexShrink: 0 }} />
          </Box>
        ))}
      </Stack>

      {relatedLinks?.length > 0 && (
        <>
          <Typography variant="caption" fontWeight={700} sx={{ color: tokens.muted, display: "block", mb: 1.5 }}>
            RELATED
          </Typography>
          <Stack direction="row" spacing={3} flexWrap="wrap">
            {relatedLinks.map((link) => (
              <Typography key={link.href} component={Link} href={link.href} variant="body2" fontWeight={600} sx={{ color: tokens.ink }}>
                {link.label} →
              </Typography>
            ))}
          </Stack>
        </>
      )}
    </Container>
  );
}
