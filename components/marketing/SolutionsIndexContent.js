import Link from "next/link";
import { Container, Typography, Stack, Box } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { tokens } from "@/lib/theme";

export default function SolutionsIndexContent({ title, description, buildHref, items, relatedLinks }) {
  return (
    <Container maxWidth="md">
      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
        {title}
      </Typography>
      <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5, maxWidth: 640 }}>
        {description}
      </Typography>

      <Stack spacing={0} sx={{ mb: relatedLinks?.length ? 6 : 0 }}>
        {items.map((item, i) => (
          <Box
            key={item.slug}
            component={Link}
            href={buildHref(item.slug)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              py: 3,
              borderTop: i === 0 ? "none" : `1px solid ${tokens.border}`,
              textDecoration: "none",
              color: "inherit",
              "&:hover .solution-arrow": { transform: "translateX(4px)" },
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: 32, md: 44 },
                fontWeight: 800,
                color: "transparent",
                WebkitTextStroke: `1.5px ${tokens.brand}`,
                minWidth: { xs: 56, md: 76 },
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </Typography>
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={700} sx={{ fontSize: { xs: 17, md: 19 }, mb: 0.5 }}>
                {item.name}
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.muted }}>
                {item.headline}
              </Typography>
            </Box>
            <ArrowForwardRoundedIcon className="solution-arrow" sx={{ color: tokens.muted, transition: "transform 150ms ease", flexShrink: 0 }} />
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
