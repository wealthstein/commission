"use client";

import { Box, Container, Typography, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";

/**
 * Deliberately simple structure - a single Box per row with sx-based flex,
 * matching the exact pattern already proven in CampaignsIndexContent.js
 * and ConversionsIndexContent.js. The original version of this component
 * nested a Stack (with a responsive direction prop) inside another mapped
 * Stack, which nothing else in this codebase does - that structural
 * difference is the most likely real cause of an earlier stack-overflow
 * bug here, though it was never fully confirmed. No icon imports, to rule
 * that out as a variable entirely too.
 */
export default function ProblemSolutionSection({ items, eyebrow = "The reality" }) {
  return (
    <Box component="section" sx={{ py: { xs: 6, md: 9 } }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{ color: tokens.muted, display: "block", mb: 1.5, letterSpacing: 1 }}
          >
            {eyebrow.toUpperCase()}
          </Typography>
          <Typography variant="h3" sx={{ fontSize: { xs: 24, md: 32 }, maxWidth: 640, mx: "auto" }}>
            What actually gets in the way, and what Commission does about it
          </Typography>
        </Box>

        <Stack spacing={2}>
          {items.map((item, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                border: `1px solid ${tokens.border}`,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <Box sx={{ flex: 1, p: 3 }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: tokens.muted, display: "block", mb: 0.5 }}>
                  THE PROBLEM
                </Typography>
                <Typography variant="body1" sx={{ color: tokens.muted }}>
                  {item.problem}
                </Typography>
              </Box>

              <Box sx={{ flex: 1, p: 3, bgcolor: "#FFFBEA" }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: tokens.brandInk, display: "block", mb: 0.5 }}>
                  HOW COMMISSION SOLVES IT
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {item.solution}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
