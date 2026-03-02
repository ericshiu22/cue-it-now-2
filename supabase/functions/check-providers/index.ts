import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TMDB_BASE = "https://api.themoviedb.org/3";

// Map TMDB provider names to internal service IDs (mirrors client-side logic)
function mapProviderToServiceId(name: string): string {
  const lower = name.toLowerCase().trim();
  if (lower === "netflix") return "netflix";
  if (lower === "max" || lower === "hbo max") return "max";
  if (lower === "disney plus" || lower === "disney+") return "disney+";
  if (lower === "hulu") return "hulu";
  if (lower.includes("amazon prime") || lower === "prime video") return "prime video";
  if (lower.includes("apple tv")) return "apple tv+";
  if (lower.includes("peacock")) return "peacock";
  if (lower.includes("paramount")) return "paramount";
  if (lower === "crunchyroll") return "crunchyroll";
  if (lower === "tubi" || lower === "tubi tv") return "tubi";
  if (lower === "pluto tv") return "pluto";
  if (lower.includes("discovery")) return "discovery";
  if (lower === "starz") return "starz";
  if (lower === "mubi") return "mubi";
  if (lower.includes("amc")) return "amc+";
  return lower; // return raw name if unknown
}

interface CueRow {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: string;
  title: string;
  service_provider: string;
  provider_status: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const tmdbApiKey = Deno.env.get("TMDB_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Support on-demand check for a single user
    let userIdFilter: string | null = null;
    try {
      const body = await req.json();
      userIdFilter = body?.user_id ?? null;
    } catch {
      // No body = batch mode (cron)
    }

    // Fetch queued cues that haven't been checked in the last 6 days
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from("cues")
      .select("id, user_id, tmdb_id, media_type, title, service_provider, provider_status")
      .in("status", ["queued", "in-progress"])
      .or(`provider_checked_at.is.null,provider_checked_at.lt.${sixDaysAgo}`);

    if (userIdFilter) {
      query = query.eq("user_id", userIdFilter);
    }

    const { data: cues, error: cuesErr } = await query.limit(200);

    if (cuesErr) throw cuesErr;
    if (!cues || cues.length === 0) {
      return new Response(
        JSON.stringify({ checked: 0, changes: 0, message: "No cues to check." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // De-duplicate by tmdb_id + media_type to minimize API calls
    const uniqueKeys = new Map<string, { tmdb_id: number; media_type: string }>();
    for (const cue of cues) {
      const key = `${cue.media_type}:${cue.tmdb_id}`;
      if (!uniqueKeys.has(key)) {
        uniqueKeys.set(key, { tmdb_id: cue.tmdb_id, media_type: cue.media_type });
      }
    }

    // Fetch TMDB watch providers for each unique title
    const providerMap = new Map<string, Set<string>>();

    for (const [key, { tmdb_id, media_type }] of uniqueKeys.entries()) {
      try {
        const res = await fetch(
          `${TMDB_BASE}/${media_type}/${tmdb_id}/watch/providers?api_key=${tmdbApiKey}`
        );
        const data = await res.json();
        const us = data?.results?.US;

        const serviceIds = new Set<string>();
        for (const category of ["flatrate", "free", "ads"]) {
          if (us?.[category]) {
            for (const p of us[category]) {
              serviceIds.add(mapProviderToServiceId(p.provider_name));
            }
          }
        }
        providerMap.set(key, serviceIds);
      } catch {
        // Skip failed lookups — don't flag as moved
      }

      // Rate-limit TMDB calls (~4 per second)
      await new Promise((r) => setTimeout(r, 260));
    }

    // Compare each cue's current provider against TMDB results
    let changes = 0;
    const notifications: Array<{
      id: string;
      user_id: string;
      alert_type: string;
      title: string;
      body: string;
      created_at: string;
    }> = [];
    const nowISO = new Date().toISOString();

    for (const cue of cues as CueRow[]) {
      const key = `${cue.media_type}:${cue.tmdb_id}`;
      const available = providerMap.get(key);

      if (!available) {
        // Couldn't fetch — just update checked_at
        await supabase
          .from("cues")
          .update({ provider_checked_at: nowISO })
          .eq("id", cue.id);
        continue;
      }

      const currentProvider = cue.service_provider.toLowerCase();
      const stillAvailable = available.has(currentProvider);

      if (stillAvailable) {
        // Provider confirmed — mark active
        if (cue.provider_status !== "active") {
          await supabase
            .from("cues")
            .update({ provider_status: "active", provider_checked_at: nowISO })
            .eq("id", cue.id);
          changes++;
        } else {
          await supabase
            .from("cues")
            .update({ provider_checked_at: nowISO })
            .eq("id", cue.id);
        }
      } else {
        // Provider no longer listed — find where it moved
        const newProvider = available.size > 0 ? [...available][0] : null;
        const newStatus = newProvider ? "moved" : "leaving";

        await supabase
          .from("cues")
          .update({
            provider_status: newStatus,
            previous_service_provider: cue.service_provider,
            provider_checked_at: nowISO,
            ...(newProvider ? { service_provider: newProvider } : {}),
          })
          .eq("id", cue.id);

        changes++;

        // Build notification
        const body = newProvider
          ? `"${cue.title}" moved from ${cue.service_provider} to ${newProvider}. Your queue has been updated.`
          : `"${cue.title}" is no longer streaming on ${cue.service_provider}. It may only be available to buy or rent.`;

        notifications.push({
          id: crypto.randomUUID(),
          user_id: cue.user_id,
          alert_type: "provider_change",
          title: newProvider
            ? `"${cue.title}" moved to ${newProvider}`
            : `"${cue.title}" leaving ${cue.service_provider}`,
          body,
          created_at: nowISO,
        });
      }
    }

    // Insert notifications
    if (notifications.length > 0) {
      await supabase.from("notifications").insert(
        notifications.map((n) => ({
          id: n.id,
          user_id: n.user_id,
          alert_type: n.alert_type,
          title: n.title,
          body: n.body,
          is_read: false,
        }))
      );
    }

    return new Response(
      JSON.stringify({ checked: cues.length, changes, notifications: notifications.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("check-providers error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
