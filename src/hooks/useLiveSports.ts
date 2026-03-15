import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { GameData } from "@/lib/mock-sports-data";

/**
 * Fetches live sports data from the live-sports edge function.
 * Falls back to empty array on error. Auto-refreshes at the given interval.
 */
export function useLiveSports(selectedDate: Date, refreshInterval = 60_000) {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchGames = useCallback(async (date: Date) => {
    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    try {
      const { data, error: fnError } = await supabase.functions.invoke("live-sports", {
        body: { date: dateStr },
      });

      if (controller.signal.aborted) return;

      if (fnError) {
        console.error("[useLiveSports] Edge function error:", fnError);
        setError(fnError.message || "Failed to fetch sports data");
        setGames([]);
        return;
      }

      const fetched: GameData[] = (data?.games || []).map((g: any) => ({
        id: g.id,
        league: g.league,
        homeTeam: g.homeTeam,
        homeAbbr: g.homeAbbr,
        homeLogo: g.homeLogo,
        homeScore: g.homeScore,
        awayTeam: g.awayTeam,
        awayAbbr: g.awayAbbr,
        awayLogo: g.awayLogo,
        awayScore: g.awayScore,
        status: g.status as GameData["status"],
        startTime: g.startTime,
        period: g.period,
        clock: g.clock,
        broadcaster: g.broadcaster || "",
        streamingService: g.streamingService || "",
      }));

      setGames(fetched);
      setIsLive(fetched.some((g) => g.status === "live"));
      setLastUpdated(new Date());
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error("[useLiveSports] Fetch error:", err);
      setError("Failed to fetch sports data");
      setGames([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  // Fetch on date change
  useEffect(() => {
    fetchGames(selectedDate);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [selectedDate, fetchGames]);

  // Auto-refresh interval
  useEffect(() => {
    intervalRef.current = setInterval(() => fetchGames(selectedDate), refreshInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedDate, fetchGames, refreshInterval]);

  const refresh = useCallback(() => {
    fetchGames(selectedDate);
  }, [selectedDate, fetchGames]);

  return { games, loading, error, lastUpdated, isLive, refresh };
}
