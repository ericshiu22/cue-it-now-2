import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Notification {
  id: string;
  user_id: string;
  alert_type: string;
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

    const notifications: Notification[] = [];
    const now = new Date();
    const nowISO = now.toISOString();

    // ─── 1. Friends Are Watching ───────────────────────────────────
    // For each user with accepted friendships, find recent cues from friends (last 3 days)
    const { data: friendships } = await supabase
      .from("friendships")
      .select("user_id, friend_id")
      .eq("status", "accepted");

    if (friendships && friendships.length > 0) {
      // Collect unique user IDs who have friends
      const usersWithFriends = new Set<string>();
      const friendMap = new Map<string, string[]>();

      for (const f of friendships) {
        // Both directions
        usersWithFriends.add(f.user_id);
        usersWithFriends.add(f.friend_id);

        if (!friendMap.has(f.user_id)) friendMap.set(f.user_id, []);
        friendMap.get(f.user_id)!.push(f.friend_id);

        if (!friendMap.has(f.friend_id)) friendMap.set(f.friend_id, []);
        friendMap.get(f.friend_id)!.push(f.user_id);
      }

      // Fetch recent cues (last 3 days) from all users who are friends of someone
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const allFriendUserIds = [...usersWithFriends];

      const { data: recentCues } = await supabase
        .from("cues")
        .select("user_id, title, service_provider, created_at")
        .in("user_id", allFriendUserIds)
        .gte("created_at", threeDaysAgo)
        .order("created_at", { ascending: false });

      if (recentCues && recentCues.length > 0) {
        // Get usernames for friend display
        const cueUserIds = [...new Set(recentCues.map((c) => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username")
          .in("user_id", cueUserIds);

        const usernameMap = new Map(
          (profiles ?? []).map((p: any) => [p.user_id, p.username || "A friend"])
        );

        // For each user, check if any of their friends added something recently
        for (const [userId, friends] of friendMap.entries()) {
          const friendCues = recentCues.filter((c) => friends.includes(c.user_id));
          if (friendCues.length === 0) continue;

          // Pick the most recent one for the notification
          const top = friendCues[0];
          const friendName = usernameMap.get(top.user_id) || "A friend";
          const extra = friendCues.length > 1 ? ` and ${friendCues.length - 1} more` : "";

          notifications.push({
            id: crypto.randomUUID(),
            user_id: userId,
            alert_type: "friend_activity",
            title: `${friendName} added "${top.title}"${extra}`,
            body: `Your friends have been adding new shows to their queues. Check out what they're watching!`,
            created_at: nowISO,
          });
        }
      }
    }

    // ─── 2. Queue Waiting Reminders ────────────────────────────────
    // Find cues with status 'queued' older than 7 days — nudge the user
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: staleCues } = await supabase
      .from("cues")
      .select("user_id, title, service_provider, created_at")
      .eq("status", "queued")
      .lte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: true });

    if (staleCues && staleCues.length > 0) {
      // Group by user
      const userStaleCues = new Map<string, typeof staleCues>();
      for (const cue of staleCues) {
        if (!userStaleCues.has(cue.user_id)) userStaleCues.set(cue.user_id, []);
        userStaleCues.get(cue.user_id)!.push(cue);
      }

      for (const [userId, cues] of userStaleCues.entries()) {
        const oldest = cues[0];
        const count = cues.length;

        notifications.push({
          id: crypto.randomUUID(),
          user_id: userId,
          alert_type: "trending",
          title: `${count} show${count > 1 ? "s" : ""} waiting in your queue`,
          body: `"${oldest.title}" has been in your queue for a while. Time to start watching!`,
          created_at: nowISO,
        });
      }
    }

    // ─── 3. Subscription Optimization (Churn) ──────────────────────
    // Find active subscriptions with no cue activity in 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: activeSubs } = await supabase
      .from("active_subscriptions")
      .select("user_id, service_name, monthly_cost")
      .eq("is_active", true);

    if (activeSubs && activeSubs.length > 0) {
      const subUserIds = [...new Set(activeSubs.map((s) => s.user_id))];

      // Fetch recent cues for these users
      const { data: recentActivity } = await supabase
        .from("cues")
        .select("user_id, service_provider, created_at")
        .in("user_id", subUserIds)
        .gte("created_at", thirtyDaysAgo);

      // Build a set of active user+service combos
      const activeSet = new Set(
        (recentActivity ?? []).map((c) => `${c.user_id}::${c.service_provider.toLowerCase()}`)
      );

      // Check for already-alerted services this month
      const { data: existingAlerts } = await supabase
        .from("churn_alerts_log")
        .select("user_id, service_name, sent_at")
        .gte("sent_at", thirtyDaysAgo);

      const alertedSet = new Set(
        (existingAlerts ?? []).map((a: any) => `${a.user_id}::${a.service_name.toLowerCase()}`)
      );

      for (const sub of activeSubs) {
        const key = `${sub.user_id}::${sub.service_name.toLowerCase()}`;
        if (activeSet.has(key) || alertedSet.has(key)) continue;

        const cost = Number(sub.monthly_cost).toFixed(2);
        notifications.push({
          id: crypto.randomUUID(),
          user_id: sub.user_id,
          alert_type: "subscription_expiry",
          title: `Save $${cost}/mo on ${sub.service_name}`,
          body: `You haven't used ${sub.service_name} in over 30 days. Consider pausing or canceling to save $${cost}/month.`,
          created_at: nowISO,
        });
      }
    }

    // ─── 4. Forward to send-reminders for filtering & dispatch ─────
    if (notifications.length > 0) {
      const sendUrl = `${supabaseUrl}/functions/v1/send-reminders`;
      const sendRes = await fetch(sendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({ notifications }),
      });
      const sendResult = await sendRes.json();

      return new Response(
        JSON.stringify({
          generated: notifications.length,
          dispatch_result: sendResult,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ generated: 0, message: "No notifications to generate." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-notifications error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
