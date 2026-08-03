"use client";

import { useState, useEffect } from "react";
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
  CardMedia,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";

// Consolidated from 8 top-level items to 6 - Network is now a tab inside
// My Promotions, and Leads is now a tab inside Transactions, so nothing
// that used to be reachable is gone, there's just one fewer click to get
// most places. "My Products" -> "My Campaigns" throughout - a campaign
// (product + its affiliate program running together) is what a business
// actually manages here, not an abstract product listing.
const NAV = [
  { href: "/dashboard", label: "Home", icon: HomeRoundedIcon },
  { href: "/dashboard/discover", label: "Discover", icon: ExploreRoundedIcon },
  { href: "/dashboard/campaigns", label: "My Campaigns", icon: CampaignRoundedIcon },
  { href: "/dashboard/promotions", label: "My Promotions", icon: Diversity3RoundedIcon },
  { href: "/dashboard/transactions", label: "Transactions", icon: ReceiptLongRoundedIcon },
  { href: "/dashboard/account", label: "Account", icon: SettingsRoundedIcon },
];

function firstNameFrom(user) {
  const given = user?.user_metadata?.given_name;
  if (given) return given;
  const fullName = user?.user_metadata?.full_name;
  if (fullName) return fullName.split(" ")[0];
  return user?.email || "there";
}

function SidebarContent({ pathname, user }) {
  const firstName = firstNameFrom(user);
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2.5, py: 3 }}>
        <CardMedia sx={{ width: 26, height: 26, borderRadius: "8px" }} image="/circle.svg" alt="Commission" />
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
      <Box sx={{ px: 2.5, py: 2.5, borderTop: `1px solid ${tokens.border}` }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar src={avatarUrl} sx={{ width: 32, height: 32, bgcolor: tokens.brand, color: tokens.brandInk, fontSize: 14, fontWeight: 700 }}>
            {firstName.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2" fontWeight={600} noWrap>
            {firstName}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/signin");
  }

  const firstName = firstNameFrom(user);
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: tokens.canvas }}>
      <Box component="nav" sx={{ width: { md: 232 }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: 232 } }}
        >
          <SidebarContent pathname={pathname} user={user} />
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { width: 232, borderRight: `1px solid ${tokens.border}`, bgcolor: tokens.paper },
          }}
          open
        >
          <SidebarContent pathname={pathname} user={user} />
        </Drawer>
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: tokens.paper, borderBottom: `1px solid ${tokens.border}` }}
        >
          <Toolbar>
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ color: tokens.ink, display: { md: "none" } }}>
              <MenuIcon />
            </IconButton>
            <Typography fontWeight={700} sx={{ ml: 1, display: { md: "none" } }}>
              Commission
            </Typography>
            <Box sx={{ flexGrow: 1 }} />

            <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)} sx={{ p: 0.5 }}>
              <Avatar src={avatarUrl} sx={{ width: 32, height: 32, bgcolor: tokens.brand, color: tokens.brandInk, fontSize: 14, fontWeight: 700 }}>
                {firstName.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu anchorEl={userMenuAnchor} open={!!userMenuAnchor} onClose={() => setUserMenuAnchor(null)}>
              <MenuItem component={Link} href="/dashboard/account" onClick={() => setUserMenuAnchor(null)}>
                <SettingsRoundedIcon fontSize="small" sx={{ mr: 1.5, color: tokens.muted }} />
                Account
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleSignOut}>
                <LogoutRoundedIcon fontSize="small" sx={{ mr: 1.5, color: tokens.muted }} />
                Sign out
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ p: { xs: 3, sm: 4, md: 6 }, maxWidth: 1080, mx: "auto" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
