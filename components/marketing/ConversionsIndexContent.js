import Link from "next/link";
import { Container, Typography, Stack, Box } from "@mui/material";
import { tokens } from "@/lib/theme";

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export default function ConversionsIndexContent({ title, description, buildHref, items, relatedLinks }) {
  return (
    <Container maxWidth="lg">
      <Box sx={{ maxWidth: 680, mx: "auto" }}>
        <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
          {title}
        </Typography>
        <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5 }}>
          {description}
        </Typography>

        <Stack spacing={2} sx={{ mb: relatedLinks?.length ? 6 : 0 }}>
          {items.map((item, i) => (
            <Box
              key={item.slug}
              component={Link}
              href={buildHref(item.slug)}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                p: 2.5,
                borderRadius: 2.5,
                textDecoration: "none",
                color: "inherit",
                "&:hover": { bgcolor: "#F1EFE7" },
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "10px",
                  bgcolor: tokens.brand,
                  color: tokens.brandInk,
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {LETTERS[i] || i + 1}
              </Box>
              <Box>
                <Typography fontWeight={700} sx={{ mb: 0.25 }}>
                  {item.name}
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.muted }}>
                  {item.headline}
                </Typography>
              </Box>
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
      </Box>
    </Container>
  );
}
