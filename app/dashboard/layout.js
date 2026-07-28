"use client";

import { useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Stack,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { tokens } from "@/lib/theme";

const NAV = [
  { href: "/dashboard", label: "Home", icon: HomeRoundedIcon },
  { href: "/dashboard/discover", label: "Discover", icon: ExploreRoundedIcon },
  { href: "/dashboard/products", label: "My Products", icon: Inventory2RoundedIcon },
  { href: "/dashboard/promotions", label: "My Promotions", icon: CampaignRoundedIcon },
  { href: "/dashboard/network", label: "Network", icon: Diversity3RoundedIcon },
  { href: "/dashboard/transactions", label: "Transactions", icon: ReceiptLongRoundedIcon },
  { href: "/dashboard/account", label: "Account", icon: SettingsRoundedIcon },
];

const DRAWER_WIDTH = 232;

function SidebarContent({ pathname }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2.5, py: 3 }}>
        <Box sx={{ width: 26, height: 26, borderRadius: "8px", bgcolor: tokens.brand, display: "grid", placeItems: "center" }}>
          <Typography sx={{ color: tokens.brandInk, fontWeight: 800, fontSize: 14, lineHeight: 1 }}>C</Typography>
        </Box>
        <Typography fontWeight={700}>Commission</Typography>
      </Stack>
      <List sx={{ px: 1.5, flexGrow: 1 }}>
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={active}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                "&.Mui-selected": { bgcolor: tokens.brand, color: tokens.brandInk },
                "&.Mui-selected:hover": { bgcolor: tokens.brand },
                "&.Mui-selected .MuiListItemIcon-root": { color: tokens.brandInk },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: tokens.muted }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ px: 2.5, py: 3, borderTop: `1px solid ${tokens.border}` }}>
        <Typography variant="caption" sx={{ color: tokens.muted }}>
          Every account can list products and promote them. No separate business/affiliate signup.
        </Typography>
      </Box>
    </Box>
  );
}

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: tokens.canvas }}>
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}
        >
          <SidebarContent pathname={pathname} />
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, borderRight: `1px solid ${tokens.border}`, bgcolor: tokens.paper },
          }}
          open
        >
          <SidebarContent pathname={pathname} />
        </Drawer>
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ display: { md: "none" }, bgcolor: tokens.paper, borderBottom: `1px solid ${tokens.border}` }}
        >
          <Toolbar>
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ color: tokens.ink }}>
              <MenuIcon />
            </IconButton>
            <Typography fontWeight={700} sx={{ ml: 1 }}>
              Commission
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Avatar sx={{ width: 32, height: 32, bgcolor: tokens.brand, color: tokens.brandInk }}>U</Avatar>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ p: { xs: 3, sm: 4, md: 6 }, maxWidth: 1080, mx: "auto" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
