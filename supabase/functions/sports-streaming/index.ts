import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WATCHMODE_BASE = "https://api.watchmode.com/v1";

/**
 * Maps Watchmode source names to internal streaming service IDs.
 */
function mapWatchmodeSource(name: string): string | null {
  const lower = name.toLowerCase().trim();
  if (lower.includes("netflix")) return "netflix";
  if (lower === "max" || lower.includes("hbo")) return "max";
  if (lower.includes("disney")) return "disney+";
  if (lower.includes("hulu")) return "hulu";
  if (lower.includes("amazon prime") || lower === "prime video") return "prime video";
  if (lower.includes("apple tv")) return "appletv";
  if (lower.includes("peacock")) return "peacock";
  if (lower.includes("paramount")) return "paramount";
  if (lower.includes("espn")) return "hulu"; // ESPN+ bundled with Hulu
  if (lower.includes("tubi")) return "tubi";
  if (lower.includes("pluto")) return "pluto";
  return null;
}

/**
 * Edge function: /sports-streaming
 * 
 * Accepts POST with JSON body:
 *   { region?: string }
 * 
 * Returns cached (1h) list of streaming sources available in the given region,
 * plus a mapping of Watchmode source_ids to our internal service IDs.
 * 
 * Also supports looking up specific title streaming sources:
 *   { action: "title-sources", tmdb_id: number, tmdb_type: "movie" | "tv", region?: string }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const watchmodeKey = Deno.env.get("WATCHMODE_API_KEY");
    if (!watchmodeKey) {
      throw new Error("WATCHMODE_API_KEY is not configured");
    }

    const body = await req.json().catch(() => ({}));
    const region = body.region || "US";
    const action = body.action || "sources";

    if (action === "sources") {
      // Get all streaming sources available in the region
      const url = `${WATCHMODE_BASE}/sources/?apiKey=${watchmodeKey}&regions=${region}&types=sub,free,tve`;
      const res = await fetch(url);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Watchmode sources API failed [${res.status}]: ${errText}`);
      }
      const sources = await res.json();

      // Build a mapping: source_id -> { name, type, internal_id, logo }
      const sourceMap: Record<number, {
        name: string;
        type: string;
        internalId: string | null;
        logo: string;
        regions: string[];
      }> = {};

      for (const s of sources) {
        sourceMap[s.id] = {
          name: s.name,
          type: s.type,
          internalId: mapWatchmodeSource(s.name),
          logo: s.logo_100px || "",
          regions: s.regions || [],
        };
      }

      return new Response(JSON.stringify({ sources: sourceMap, region }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "title-sources") {
      const { tmdb_id, tmdb_type } = body;
      if (!tmdb_id || !tmdb_type) {
        return new Response(
          JSON.stringify({ error: "tmdb_id and tmdb_type are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Use TMDB format for lookup: "movie-{id}" or "tv-{id}"
      const titleId = `${tmdb_type}-${tmdb_id}`;
      const url = `${WATCHMODE_BASE}/title/${titleId}/sources/?apiKey=${watchmodeKey}&regions=${region}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Watchmode title sources API failed [${res.status}]: ${errText}`);
      }

      const rawSources = await res.json();

      // Simplify and map to internal IDs
      const mappedSources = rawSources
        .filter((s: any) => s.type === "sub" || s.type === "free" || s.type === "tve")
        .map((s: any) => ({
          sourceId: s.source_id,
          name: s.name,
          type: s.type,
          internalId: mapWatchmodeSource(s.name),
          webUrl: s.web_url,
          region: s.region,
          format: s.format,
        }));

      return new Response(JSON.stringify({ sources: mappedSources, titleId, region }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "networks") {
      // Get TV networks (useful for mapping broadcasters)
      const url = `${WATCHMODE_BASE}/networks/?apiKey=${watchmodeKey}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Watchmode networks API failed [${res.status}]: ${errText}`);
      }
      const networks = await res.json();

      return new Response(JSON.stringify({ networks }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("sports-streaming error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
