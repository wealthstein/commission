"use client";

import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "@/lib/theme";

export default function Providers({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
