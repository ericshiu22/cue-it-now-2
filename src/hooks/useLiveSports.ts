import { useState, useEffect, useCallback, useRef } from "react";
import type { GameData } from "@/lib/mock-sports-data";
import { MOCK_GAMES } from "@/lib/mock-sports-data";

/**
 * Returns live sports games. Currently uses season-aware mock data
 * with auto-refresh to simulate live score updates.
 * 
 * When a paid API-Sports plan is available, this hook can be updated
 * to fetch real data from the edge function.
 */
export function useLiveSports(refreshInterval = 60_000) {
  const [games, setGames] = useState<GameData[]>(MOCK_GAMES);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => {
    // Re-import to get fresh relative timestamps
    // MOCK_GAMES uses ago()/later() which are relative to import time
    // For now, just update the timestamp
    setGames([...MOCK_GAMES]);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, refreshInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh, refreshInterval]);

  return { games, loading, error: null, lastUpdated, isLive: false, refresh };
}
