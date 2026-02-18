import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Get all users with churn_alerts_enabled
    const { data: profiles, error: profilesErr } = await supabase
      .from("profiles")
      .select("user_id, alert_level, email_enabled, push_enabled, churn_alerts_enabled")
      .eq("churn_alerts_enabled", true);

    if (profilesErr) throw new Error(`Profiles fetch failed: ${profilesErr.message}`);
    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, alerts_triggered: 0, message: "No users with churn alerts enabled." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = profiles.map((p: any) => p.user_id);

    // 2. Get active subscriptions for these users
    const { data: subscriptions, error: subsErr } = await supabase
      .from("active_subscriptions")
      .select("*")
      .in("user_id", userIds)
      .eq("is_active", true);

    if (subsErr) throw new Error(`Subscriptions fetch failed: ${subsErr.message}`);
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, alerts_triggered: 0, message: "No active subscriptions found." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Get recent cue activity (queued or in-progress in last 30 days)
    const { data: recentCues, error: cuesErr } = await supabase
      .from("cues")
      .select("user_id, service_provider, status, created_at")
      .in("user_id", userIds)
      .in("status", ["queued", "in-progress"])
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (cuesErr) throw new Error(`Cues fetch failed: ${cuesErr.message}`);

    // Build a set of "user_id::service" that had activity
    const activeUserServices = new Set(
      (recentCues ?? []).map((c: any) => `${c.user_id}::${c.service_provider}`)
    );

    // 4. Get existing churn alerts sent in the last 30 days
    const { data: recentAlerts, error: alertsErr } = await supabase
      .from("churn_alerts_log")
      .select("user_id, service_name, sent_at")
      .in("user_id", userIds)
      .gte("sent_at", oneMonthAgo.toISOString());

    if (alertsErr) throw new Error(`Alerts log fetch failed: ${alertsErr.message}`);

    const alreadyAlerted = new Set(
      (recentAlerts ?? []).map((a: any) => `${a.user_id}::${a.service_name}`)
    );

    // 5. For each subscription with zero activity, trigger alert
    let alertsTriggered = 0;
    const results: { user_id: string; service: string; status: string; reason?: string }[] = [];

    for (const sub of subscriptions) {
      const key = `${sub.user_id}::${sub.service_name}`;

      // Skip if activity exists
      if (activeUserServices.has(key)) {
        results.push({ user_id: sub.user_id, service: sub.service_name, status: "skipped", reason: "has_activity" });
        continue;
      }

      // Skip if already alerted this month
      if (alreadyAlerted.has(key)) {
        results.push({ user_id: sub.user_id, service: sub.service_name, status: "skipped", reason: "already_alerted_this_month" });
        continue;
      }

      // Count cued shows for this user+service (all time, for email context)
      const cuedCount = (recentCues ?? []).filter(
        (c: any) => c.user_id === sub.user_id && c.service_provider === sub.service_name
      ).length;

      // Log the alert
      const { error: logErr } = await supabase
        .from("churn_alerts_log")
        .insert({ user_id: sub.user_id, service_name: sub.service_name });

      if (logErr) {
        console.error(`Failed to log alert for ${key}:`, logErr.message);
        results.push({ user_id: sub.user_id, service: sub.service_name, status: "error", reason: logErr.message });
        continue;
      }

      // In production: call send-reminders or an email API here.
      // For now, log the alert payload.
      console.log(
        `[CHURN ALERT] user=${sub.user_id} service=${sub.service_name} cost=$${sub.monthly_cost} shows_watched=0 shows_cued=${cuedCount}`
      );

      results.push({ user_id: sub.user_id, service: sub.service_name, status: "alert_triggered" });
      alertsTriggered++;
    }

    return new Response(
      JSON.stringify({
        processed: subscriptions.length,
        alerts_triggered: alertsTriggered,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("calculate-churn error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
