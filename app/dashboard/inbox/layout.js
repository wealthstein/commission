"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, Tabs, Tab } from "@mui/material";
import { tokens } from "@/lib/theme";
import { useCurrentBusiness } from "@/lib/useCurrentBusiness";
import { createClient } from "@/lib/supabaseClient";
import InboxNotificationPrompt from "@/components/dashboard/inbox/InboxNotificationPrompt";

const SECTIONS = [
  { href: "/dashboard/inbox", label: "Chats" },
  { href: "/dashboard/inbox/pipeline", label: "Pipeline" },
  { href: "/dashboard/inbox/leads", label: "Leads" },
  { href: "/dashboard/inbox/tasks", label: "Tasks" },
  { href: "/dashboard/inbox/inventory", label: "Inventory" },
  { href: "/dashboard/inbox/insights", label: "Insights" },
  { href: "/dashboard/inbox/connections", label: "Connections" },
];

export default function InboxLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { business } = useCurrentBusiness();

  // Idempotent - the SQL function only inserts if this business has no
  // stages yet, so this is safe to call every time someone enters Inbox.
  useEffect(() => {
    if (!business) return;
    const supabase = createClient();
    supabase.rpc("inbox_seed_default_pipeline", { target_business_id: business.id });
  }, [business]);

  // Exact match, evaluated most-specific-first, so "/dashboard/inbox" (the
  // Chats tab) doesn't also match every nested sub-route as a prefix.
  const activeIndex = Math.max(
    0,
    [...SECTIONS].reverse().findIndex((s) => pathname === s.href || pathname.startsWith(s.href + "/"))
  );
  const resolvedIndex = SECTIONS.length - 1 - activeIndex;

  return (
    <Box>
      <Tabs
        value={resolvedIndex}
        onChange={(_, v) => router.push(SECTIONS[v].href)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ mb: 3, borderBottom: `1px solid ${tokens.border}` }}
      >
        {SECTIONS.map((s) => (
          <Tab key={s.href} label={s.label} sx={{ textTransform: "none", fontWeight: 600 }} />
        ))}
      </Tabs>
      {children}
      <InboxNotificationPrompt businessId={business?.id} />
    </Box>
  );
}
