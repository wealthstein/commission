"use client";

import { useEffect, useState } from "react";
import { Fab, Zoom } from "@mui/material";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import { tokens } from "@/lib/theme";

export default function GoToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 480);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Zoom in={visible}>
      <Fab
        size="medium"
        aria-label="Go to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1200,
          bgcolor: tokens.ink,
          color: "#fff",
          "&:hover": { bgcolor: "#000" },
        }}
      >
        <ArrowUpwardRoundedIcon />
      </Fab>
    </Zoom>
  );
}
