import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WatchmodeSource {
  name: string;
  type: string;
  internalId: string | null;
  logo: string;
  regions: string[];
}

interface WatchmodeTitleSource {
  sourceId: number;
  name: string;
  type: string;
  internalId: string | null;
  webUrl: string | null;
  region: string;
  format: string | null;
}

interface UseWatchmodeReturn {
  sources: Record<number, WatchmodeSource> | null;
  loading: boolean;
  error: string | null;
  lookupTitleSources: (tmdbId: number, tmdbType: "movie" | "tv", region?: string) => Promise<WatchmodeTitleSource[]>;
}

export const useWatchmode = (region: string = "US"): UseWatchmodeReturn => {
  const [sources, setSources] = useState<Record<number, WatchmodeSource> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("sports-streaming", {
          body: { action: "sources", region },
        });

        if (fnError) throw fnError;
        setSources(data.sources);
      } catch (err: any) {
        console.error("Watchmode sources error:", err);
        setError(err.message || "Failed to load streaming sources");
      } finally {
        setLoading(false);
      }
    };

    fetchSources();
  }, [region]);

  const lookupTitleSources = async (
    tmdbId: number,
    tmdbType: "movie" | "tv",
    lookupRegion?: string
  ): Promise<WatchmodeTitleSource[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke("sports-streaming", {
        body: {
          action: "title-sources",
          tmdb_id: tmdbId,
          tmdb_type: tmdbType,
          region: lookupRegion || region,
        },
      });

      if (fnError) throw fnError;
      return data.sources || [];
    } catch (err: any) {
      console.error("Watchmode title lookup error:", err);
      return [];
    }
  };

  return { sources, loading, error, lookupTitleSources };
};
