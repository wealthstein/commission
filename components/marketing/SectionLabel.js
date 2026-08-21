import { Stack, Box, Typography } from "@mui/material";
import { tokens } from "@/lib/theme";

/**
 * The small yellow-dot + uppercase label pattern from the reference site,
 * replacing the previous colored Chip eyebrow treatment. Meant to be
 * reused as the section label everywhere a section previously used a
 * plain overline/eyebrow Typography or a Chip.
 */
export default function SectionLabel({ children, sx }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, ...sx }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: tokens.brand, flexShrink: 0 }} />
      <Typography
        variant="overline"
        sx={{ color: tokens.muted, fontWeight: 700, letterSpacing: 1.2, lineHeight: 1 }}
      >
        {children}
      </Typography>
    </Stack>
  );
}
