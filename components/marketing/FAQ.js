"use client";

import { useState } from "react";
import { Box, Container, Typography, Paper, Chip } from "@mui/material";
import { tokens } from "@/lib/theme";

function FaqRow({ item, isOpen, onToggle, isFirst }) {
  return (
    <Box sx={{ borderTop: isFirst ? "none" : `1px solid ${tokens.border}` }}>
      <Box
        component="button"
        onClick={onToggle}
        sx={{
          all: "unset",
          display: "block",
          width: "100%",
          cursor: "pointer",
          py: 3,
          "&:focus-visible": { outline: `2px solid ${tokens.ink}`, outlineOffset: 2 },
        }}
      >
        <Typography fontWeight={700} sx={{ fontSize: { xs: 16, md: 18 } }}>
          {item.q}
        </Typography>
      </Box>
      {isOpen && (
        <Typography variant="body2" sx={{ color: tokens.muted, pb: 3, lineHeight: 1.7 }}>
          {item.a}
        </Typography>
      )}
    </Box>
  );
}

export default function FAQ({ items, eyebrow = "FAQ", title = "Frequently asked questions", subtitle }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <Box component="section" id="faq" sx={{ py: { xs: 6, md: 9 } }}>
      <Container maxWidth="lg">
        <Box sx={{ mx: "auto" }}>
          <Box sx={{ textAlign: "center", mb: 5 }}>
            <Chip label={eyebrow} size="small" sx={{ bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700, mb: 2.5 }} />
            <Typography variant="h3" sx={{ fontSize: { xs: 26, md: 34 }, mb: subtitle ? 1.5 : 0, mx: "auto" }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body1" sx={{ color: tokens.muted, mx: "auto" }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          <Paper variant="outlined" sx={{ borderColor: tokens.border, borderRadius: 1, px: { xs: 3, md: 5 } }}>
            {items.map((item, i) => (
              <FaqRow
                key={item.q}
                item={item}
                isFirst={i === 0}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
              />
            ))}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
