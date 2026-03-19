import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TMDB_BASE = "https://api.themoviedb.org/3";

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
    const tmdbApiKey = Deno.env.get("TMDB_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const notifications: Notification[] = [];
    const now = new Date();
    const nowISO = now.toISOString();

    // ─── 1. Friends' Picks (shows not in your queue) ─────────────
    // For each user, find recent cues from friends that the user doesn't already have
    const { data: friendships } = await supabase
      .from("friendships")
      .select("user_id, friend_id")
      .eq("status", "accepted");

    if (friendships && friendships.length > 0) {
      const usersWithFriends = new Set<string>();
      const friendMap = new Map<string, string[]>();

      for (const f of friendships) {
        usersWithFriends.add(f.user_id);
        usersWithFriends.add(f.friend_id);

        if (!friendMap.has(f.user_id)) friendMap.set(f.user_id, []);
        friendMap.get(f.user_id)!.push(f.friend_id);

        if (!friendMap.has(f.friend_id)) friendMap.set(f.friend_id, []);
        friendMap.get(f.friend_id)!.push(f.user_id);
      }

      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const allFriendUserIds = [...usersWithFriends];

      const { data: recentCues } = await supabase
        .from("cues")
        .select("user_id, title, tmdb_id, service_provider, created_at")
        .in("user_id", allFriendUserIds)
        .gte("created_at", threeDaysAgo)
        .order("created_at", { ascending: false });

      // Also fetch all cues for users who have friends (to check what's already in their queue)
      const { data: allUserCues } = await supabase
        .from("cues")
        .select("user_id, tmdb_id")
        .in("user_id", allFriendUserIds);

      // Build a set of tmdb_ids per user for quick lookup
      const userCueSet = new Map<string, Set<number>>();
      for (const cue of allUserCues ?? []) {
        if (!userCueSet.has(cue.user_id)) userCueSet.set(cue.user_id, new Set());
        userCueSet.get(cue.user_id)!.add(cue.tmdb_id);
      }

      if (recentCues && recentCues.length > 0) {
        const cueUserIds = [...new Set(recentCues.map((c) => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username")
          .in("user_id", cueUserIds);

        const usernameMap = new Map(
          (profiles ?? []).map((p: any) => [p.user_id, p.username || "A friend"])
        );

        for (const [userId, friends] of friendMap.entries()) {
          const myShows = userCueSet.get(userId) ?? new Set();

          // Only include friend cues for shows NOT already in this user's queue
          const friendCues = recentCues.filter(
            (c) => friends.includes(c.user_id) && !myShows.has(c.tmdb_id)
          );
          if (friendCues.length === 0) continue;

          const top = friendCues[0];
          const friendName = usernameMap.get(top.user_id) || "A friend";
          const extra = friendCues.length > 1 ? ` and ${friendCues.length - 1} more` : "";

          notifications.push({
            id: crypto.randomUUID(),
            user_id: userId,
            alert_type: "friend_activity",
            title: `${friendName} added "${top.title}"${extra}`,
            body: `Your friends are watching shows that aren't in your queue yet. Check them out!`,
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

    // ─── 3. New Seasons & Episodes (via TMDB) ─────────────────────
    // Check TV shows in users' queues for upcoming/recent new seasons
    if (tmdbApiKey) {
      const { data: tvCues } = await supabase
        .from("cues")
        .select("user_id, tmdb_id, title, service_provider")
        .eq("media_type", "tv")
        .in("status", ["queued", "in-progress"]);

      if (tvCues && tvCues.length > 0) {
        // De-duplicate by tmdb_id to minimize API calls
        const uniqueShows = new Map<number, { title: string; users: string[] }>();
        for (const cue of tvCues) {
          if (!uniqueShows.has(cue.tmdb_id)) {
            uniqueShows.set(cue.tmdb_id, { title: cue.title, users: [] });
          }
          uniqueShows.get(cue.tmdb_id)!.users.push(cue.user_id);
        }

        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        for (const [tmdbId, show] of uniqueShows.entries()) {
          try {
            const res = await fetch(
              `${TMDB_BASE}/tv/${tmdbId}?api_key=${tmdbApiKey}`
            );
            if (!res.ok) continue;
            const data = await res.json();

            // Check next episode air date
            const nextEp = data.next_episode_to_air;
            const lastEp = data.last_episode_to_air;

            // New episode coming soon (within 14 days)
            if (nextEp?.air_date) {
              const airDate = new Date(nextEp.air_date);
              if (airDate >= now && airDate <= fourteenDaysFromNow) {
                const isNewSeason = nextEp.season_number > 1 && nextEp.episode_number === 1;
                const alertType = isNewSeason ? "new_season" : "new_episode";
                const label = isNewSeason
                  ? `Season ${nextEp.season_number}`
                  : `S${nextEp.season_number}E${nextEp.episode_number}`;

                for (const userId of show.users) {
                  notifications.push({
                    id: crypto.randomUUID(),
                    user_id: userId,
                    alert_type: alertType,
                    title: isNewSeason
                      ? `New season of "${show.title}" premieres ${nextEp.air_date}`
                      : `New episode of "${show.title}" — ${label} airs ${nextEp.air_date}`,
                    body: isNewSeason
                      ? `${show.title} Season ${nextEp.season_number} is premiering soon. Make sure your subscription is active!`
                      : `A new episode of ${show.title} (${label}: "${nextEp.name || ""}") is airing soon.`,
                    created_at: nowISO,
                  });
                }
              }
            }

            // Recently aired episode (within last 14 days) — "catch up" nudge
            if (lastEp?.air_date && !nextEp?.air_date) {
              const lastAirDate = new Date(lastEp.air_date);
              if (lastAirDate >= fourteenDaysAgo && lastAirDate <= now) {
                const isNewSeason = lastEp.season_number > 1 && lastEp.episode_number === 1;
                if (isNewSeason) {
                  for (const userId of show.users) {
                    notifications.push({
                      id: crypto.randomUUID(),
                      user_id: userId,
                      alert_type: "new_season",
                      title: `"${show.title}" Season ${lastEp.season_number} just dropped!`,
                      body: `Season ${lastEp.season_number} of ${show.title} recently premiered. Time to start watching!`,
                      created_at: nowISO,
                    });
                  }
                }
              }
            }
          } catch {
            // Skip failed lookups
          }

          // Rate-limit TMDB calls
          await new Promise((r) => setTimeout(r, 260));
        }
      }
    }

    // ─── 4. Subscription Optimization (Churn) ──────────────────────
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
