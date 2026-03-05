import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { GameData } from "@/lib/mock-sports-data";
import { getGamesForDate } from "@/lib/mock-sports-data";

/**
 * Returns sports games for a given date. Uses season-aware mock data
 * with auto-refresh to simulate live score updates.
 */
export function useLiveSports(selectedDate: Date, refreshInterval = 60_000) {
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => {
    setTick((t) => t + 1);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(refresh, refreshInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh, refreshInterval]);

  // Re-compute games whenever date or tick changes
  const games = useMemo(() => {
    return getGamesForDate(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, tick]);

  return { games, loading, error: null, lastUpdated, isLive: false, refresh };
}
