"use client";

import { useState } from "react";
import { Snackbar, Button, IconButton } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { usePushNotifications } from "@/lib/inbox/usePushNotifications";

export default function InboxNotificationPrompt({ businessId }) {
  const { status, subscribe } = usePushNotifications(businessId);
  const [dismissed, setDismissed] = useState(false);

  const show = !dismissed && (status === "idle" || status === "subscribing") && !!businessId;

  return (
    <Snackbar
      open={show}
      message="Turn on notifications so you don't miss a new WhatsApp message"
      action={
        <>
          <Button color="inherit" size="small" onClick={subscribe} disabled={status === "subscribing"} sx={{ fontWeight: 700 }}>
            Enable
          </Button>
          <IconButton size="small" color="inherit" onClick={() => setDismissed(true)} aria-label="Dismiss">
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </>
      }
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    />
  );
}
