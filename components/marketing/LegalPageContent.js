import { Box, Container, Typography, Stack, Chip } from "@mui/material";
import { tokens } from "@/lib/theme";
import { withPeriod } from "@/lib/textFormat";

/**
 * sections: [{ heading, body }] where body is a string or array of strings
 * (rendered as separate paragraphs within that section).
 */
export default function LegalPageContent({ eyebrow, title, intro, lastUpdated, sections }) {
  return (
    <Box sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="md">
        <Box sx={{ maxWidth: 720, mx: "auto" }}>
          <Chip label={eyebrow} size="small" sx={{ bgcolor: "#F7F6F2", fontWeight: 600, mb: 2 }} />
          <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 42 }, mb: 1.5 }}>
            {withPeriod(title)}
          </Typography>
          <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mb: 3 }}>
            Last updated {lastUpdated}
          </Typography>
          <Typography variant="body1" sx={{ color: tokens.muted, mb: 6, fontSize: 17, lineHeight: 1.7 }}>
            {intro}
          </Typography>

          <Stack spacing={5}>
            {sections.map((section, i) => {
              const paragraphs = Array.isArray(section.body) ? section.body : [section.body];
              return (
                <Box key={section.heading} sx={{ pt: i === 0 ? 0 : 5, borderTop: i === 0 ? "none" : `1px solid ${tokens.border}` }}>
                  <Typography variant="h5" fontWeight={700} sx={{ mb: 1.5 }}>
                    {i + 1}. {section.heading}
                  </Typography>
                  <Stack spacing={1.5}>
                    {paragraphs.map((p, j) => (
                      <Typography key={j} variant="body1" sx={{ color: tokens.muted, lineHeight: 1.75 }}>
                        {p}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
