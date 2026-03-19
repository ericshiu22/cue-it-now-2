import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface QueuedNotification {
  id: string;
  user_id: string;
  alert_type: string;
  title: string;
  body: string;
  created_at: string;
}

// Color accents per notification type for email styling
const alertColors: Record<string, string> = {
  friend_activity: "#8b5cf6",    // purple
  new_season: "#f59e0b",         // amber
  new_episode: "#3b82f6",        // blue
  provider_change: "#ef4444",    // red
  subscription_expiry: "#10b981", // green
  trending: "#6366f1",            // indigo
};

function buildEmailHtml(alertType: string, subject: string, body: string): string {
  const accent = alertColors[alertType] || "#1a1a2e";

  return `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
    <div style="border-left:4px solid ${accent};padding-left:16px;margin-bottom:16px;">
      <h2 style="color:#1a1a2e;margin:0 0 8px 0;font-size:18px;">${subject}</h2>
    </div>
    <p style="color:#555;line-height:1.6;margin:0 0 16px 0;">${body}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
    <p style="color:#999;font-size:12px;margin:0;">Sent by Cue It &bull; Manage preferences in your profile settings</p>
  </div>`;
}

async function sendEmailViaResend(
  to: string,
  subject: string,
  body: string,
  alertType: string = "trending"
): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("[EMAIL] RESEND_API_KEY not configured, skipping email");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Cue It <notifications@resend.dev>",
        to: [to],
        subject,
        html: buildEmailHtml(alertType, subject, body),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[EMAIL] Resend error:", data);
      return false;
    }
    console.log("[EMAIL] Sent to", to, "id:", data.id);
    return true;
  } catch (err) {
    console.error("[EMAIL] Failed:", err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

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

    // Fetch profiles for filtering
    const userIds = [...new Set(notifications.map((n) => n.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, alert_level, email_enabled, push_enabled, churn_alerts_enabled, email")
      .in("user_id", userIds);

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    const profileMap = new Map(
      (profiles ?? []).map((p: any) => [p.user_id, p])
    );

    const now = new Date();
    let sent = 0;
    let skipped = 0;
    const results: { id: string; status: string; reason?: string; channels?: string[] }[] = [];

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
          // Minimalist: only money-saving alerts + new seasons (big events)
          if (
            notif.alert_type === "subscription_expiry" ||
            notif.alert_type === "new_season" ||
            notif.alert_type === "provider_change"
          ) {
            allowed = true;
          } else {
            reason = "minimalist_filter";
          }
          break;

        case "balanced": {
          const createdAt = new Date(notif.created_at);
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (createdAt >= sevenDaysAgo) {
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
          allowed = true;
          break;

        default:
          allowed = true;
          break;
      }

      if (allowed && !profile.email_enabled && !profile.push_enabled) {
        allowed = false;
        reason = "all_channels_disabled";
      }

      if (allowed) {
        const channels: string[] = [];

        // ── Store in-app notification ──
        await supabase.from("notifications").insert({
          user_id: notif.user_id,
          alert_type: notif.alert_type,
          title: notif.title,
          body: notif.body,
        });
        channels.push("in_app");

        // ── Send email via Resend ──
        if (profile.email_enabled && profile.email) {
          const emailSent = await sendEmailViaResend(
            profile.email,
            notif.title,
            notif.body,
            notif.alert_type
          );
          if (emailSent) channels.push("email");
        }

        console.log(
          `[SEND] user=${notif.user_id} type=${notif.alert_type} channels=${channels.join(",")}`
        );
        results.push({ id: notif.id, status: "sent", channels });
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
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
