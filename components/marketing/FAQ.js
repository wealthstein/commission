"use client";

import { Box, Container, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { tokens } from "@/lib/theme";

export default function FAQ({ items }) {
  return (
    <Box component="section" id="faq" sx={{ py: { xs: 6, md: 9 }, borderTop: `1px solid ${tokens.border}` }}>
      <Container maxWidth="md">
        <Typography variant="h3" sx={{ fontSize: { xs: 24, md: 30 }, mb: 4 }}>
          Frequently asked questions
        </Typography>
        {items.map((item) => (
          <Accordion
            key={item.q}
            disableGutters
            elevation={0}
            sx={{
              border: `1px solid ${tokens.border}`,
              borderRadius: "12px !important",
              mb: 1.5,
              "&:before": { display: "none" },
              overflow: "hidden",
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>{item.q}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" sx={{ color: tokens.muted }}>
                {item.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>
    </Box>
  );
}
