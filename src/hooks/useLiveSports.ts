import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { GameData } from "@/lib/mock-sports-data";
import { MOCK_GAMES, isLeagueInSeason } from "@/lib/mock-sports-data";

interface LiveSportsResponse {
  games: GameData[];
  date: string;
  count: number;
}

/**
 * Fetches live sports data from API-Sports via edge function.
 * Falls back to mock data if the API call fails.
 * Auto-refreshes every `refreshInterval` ms (default 60s).
 */
export function useLiveSports(refreshInterval = 60_000) {
  const [games, setGames] = useState<GameData[]>(MOCK_GAMES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchGames = useCallback(async () => {
    try {
      // Get today's date in YYYY-MM-DD
      const today = new Date().toISOString().split("T")[0];

      // Only request leagues that are currently in season
      const inSeasonLeagues = [
        "NBA", "NHL", "MLS", "EPL", "La Liga", "UCL", "Liga MX",
        "MLB", "NFL", "NCAAF", "NCAAM"
      ].filter(isLeagueInSeason);

      if (inSeasonLeagues.length === 0) {
        setGames([]);
        setLoading(false);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke("live-sports", {
        body: { date: today, leagues: inSeasonLeagues },
      });

      if (fnError) throw fnError;

      const response = data as LiveSportsResponse;

      if (response.games && response.games.length > 0) {
        setGames(response.games);
        setIsLive(true);
        setError(null);
      } else {
        // No games from API — keep mock as fallback for in-season leagues
        setGames(MOCK_GAMES);
        setIsLive(false);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch live sports:", err);
      setError("Using cached data — live feed unavailable");
      // Keep existing games (mock fallback)
      setGames((prev) => prev.length > 0 ? prev : MOCK_GAMES);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();

    // Auto-refresh
    intervalRef.current = setInterval(fetchGames, refreshInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchGames, refreshInterval]);

  return { games, loading, error, lastUpdated, isLive, refresh: fetchGames };
}
