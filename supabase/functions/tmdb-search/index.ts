import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TMDB_BASE = "https://api.themoviedb.org/3";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("TMDB_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "TMDB API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, query, mediaType, id } = await req.json();

    let url: string;

    switch (action) {
      case "search":
        url = `${TMDB_BASE}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`;
        break;
      case "trending":
        url = `${TMDB_BASE}/trending/all/week?api_key=${apiKey}`;
        break;
      case "details":
        url = `${TMDB_BASE}/${mediaType}/${id}?api_key=${apiKey}`;
        break;
      case "providers":
        url = `${TMDB_BASE}/${mediaType}/${id}/watch/providers?api_key=${apiKey}`;
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const tmdbRes = await fetch(url);
    const data = await tmdbRes.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
