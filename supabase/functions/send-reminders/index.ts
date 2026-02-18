import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface QueuedNotification {
  id: string;
  user_id: string;
  alert_type: string; // e.g. "subscription_expiry", "new_release", "friend_activity", "trending", "price_drop"
  title: string;
  body: string;
  created_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Fetch all pending notifications (from a hypothetical notification_queue table)
    //    For now we accept them via the request body so the function can be tested
    //    and later wired to a cron job + queue table.
    let notifications: QueuedNotification[] = [];

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      notifications = body.notifications ?? [];
    }

    if (notifications.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, skipped: 0, message: "No notifications to process." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Collect unique user IDs and fetch their profiles
    const userIds = [...new Set(notifications.map((n) => n.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, alert_level, email_enabled, push_enabled, churn_alerts_enabled")
      .in("user_id", userIds);

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    const profileMap = new Map(
      (profiles ?? []).map((p: any) => [p.user_id, p])
    );

    // 3. Filter notifications based on each user's alert_level
    const now = new Date();
    let sent = 0;
    let skipped = 0;
    const results: { id: string; status: string; reason?: string }[] = [];

    for (const notif of notifications) {
      const profile = profileMap.get(notif.user_id);

      if (!profile) {
        results.push({ id: notif.id, status: "skipped", reason: "no_profile" });
        skipped++;
        continue;
      }

      const alertLevel: string = profile.alert_level ?? "balanced";
      let allowed = false;
      let reason = "";

      switch (alertLevel) {
        case "minimalist":
          // Only allow subscription_expiry alerts
          if (notif.alert_type === "subscription_expiry") {
            allowed = true;
          } else {
            reason = "minimalist_filter";
          }
          break;

        case "balanced": {
          // Allow at most once every 7 days per user
          // We check the notification's created_at against a 7-day window
          const createdAt = new Date(notif.created_at);
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (createdAt >= sevenDaysAgo) {
            // Check if we've already sent to this user in this batch
            // In production you'd check a last_notified_at column; here we allow the first per user
            const alreadySentToUser = results.some(
              (r) =>
                r.status === "sent" &&
                notifications.find((n) => n.id === r.id)?.user_id === notif.user_id
            );
            if (alreadySentToUser) {
              reason = "balanced_rate_limit";
            } else {
              allowed = true;
            }
          } else {
            reason = "balanced_too_old";
          }
          break;
        }

        case "command_center":
          // All notifications pass through
          allowed = true;
          break;

        default:
          // Fallback: treat as balanced, allow
          allowed = true;
          break;
      }

      // Check channel preferences
      if (allowed) {
        if (!profile.email_enabled && !profile.push_enabled) {
          allowed = false;
          reason = "all_channels_disabled";
        }
      }

      if (allowed) {
        // ── Dispatch the notification ──
        // In production, integrate with an email service (Resend, SendGrid, etc.)
        // and/or push notification provider here.
        console.log(
          `[SEND] user=${notif.user_id} type=${notif.alert_type} title="${notif.title}" email=${profile.email_enabled} push=${profile.push_enabled}`
        );
        results.push({ id: notif.id, status: "sent" });
        sent++;
      } else {
        console.log(
          `[SKIP] user=${notif.user_id} type=${notif.alert_type} reason=${reason}`
        );
        results.push({ id: notif.id, status: "skipped", reason });
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({ sent, skipped, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-reminders error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
