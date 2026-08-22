import { createTheme } from "@mui/material/styles";

// Design tokens
// Ink        #0B0B0C   primary text, near-black (softer than pure black on white)
// Paper      #FFFFFF   surfaces
// Canvas     #FAFAF8   page background (warm off-white)
// Brand      #FFCB05   signature yellow -- CTAs, highlights, tier-1 accents
// Brand-Ink  #4A3B00   text-on-yellow (dark amber, avoids harsh black-on-yellow)
// Muted      #6B7280   secondary/tier-3 metadata
// Success    #12805C   positive commission/payout states
// Border     #E7E5DE
export const tokens = {
  ink: "#0B0B0C",
  paper: "#FFFFFF",
  canvas: "#FAFAF8",
  brand: "#FFCB05",
  brandInk: "#4A3B00",
  muted: "#6B7280",
  success: "#12805C",
  danger: "#B3261E",
  border: "#E7E5DE",
};

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: tokens.brand, contrastText: tokens.brandInk },
    text: { primary: tokens.ink, secondary: tokens.muted },
    background: { default: tokens.canvas, paper: tokens.paper },
    success: { main: tokens.success },
    error: { main: tokens.danger },
    divider: tokens.border,
  },
  shape: { borderRadius: 8 },
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
  typography: {
    fontFamily: '"Space Grotesk", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 600, letterSpacing: "-0.01em" },
    h4: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiContainer: {
      defaultProps: { maxWidth: "md" },
      styleOverrides: {
        root: {
          paddingLeft: 24,
          paddingRight: 24,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, paddingLeft: 20, paddingRight: 20 },
        containedPrimary: {
          backgroundColor: tokens.brand,
          color: tokens.brandInk,
          "&:hover": { backgroundColor: "#E6B800" },
        },
        outlined: { borderColor: tokens.border, color: tokens.ink },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } },
    },
  },
});

export default theme;