import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Zap, Trophy } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScoreboardCard from "@/components/ScoreboardCard";
import SeasonPassTracker from "@/components/SeasonPassTracker";
import { MOCK_GAMES, type League } from "@/lib/mock-sports-data";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const LEAGUES: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "NFL", label: "🏈 NFL" },
  { value: "NBA", label: "🏀 NBA" },
  { value: "MLB", label: "⚾ MLB" },
  { value: "NHL", label: "🏒 NHL" },
  { value: "NCAAF", label: "🏈 NCAAF" },
  { value: "WNBA", label: "🏀 WNBA" },
  { value: "NCAAM", label: "🏀 NCAAM" },
  { value: "NCAAW", label: "🏀 NCAAW" },
  { value: "F1", label: "🏎️ F1" },
  { value: "NASCAR", label: "🏁 NASCAR" },
  { value: "Golf", label: "⛳ Golf" },
];

const LiveSports = () => {
  const { user } = useAuth();
  const [activeLeague, setActiveLeague] = useState("all");
  const [followedGames, setFollowedGames] = useState<Set<string>>(new Set());

  const filteredGames = useMemo(() => {
    const games = activeLeague === "all"
      ? MOCK_GAMES
      : MOCK_GAMES.filter((g) => g.league === activeLeague);

    const order = { live: 0, scheduled: 1, final: 2 };
    return [...games].sort((a, b) => order[a.status] - order[b.status]);
  }, [activeLeague]);

  const liveCount = MOCK_GAMES.filter((g) => g.status === "live").length;

  // Count followed games per league for season pass auto-detect
  const followedByLeague = useMemo(() => {
    const counts: Record<string, number> = {};
    followedGames.forEach((gameId) => {
      const game = MOCK_GAMES.find((g) => g.id === gameId);
      if (game) counts[game.league] = (counts[game.league] || 0) + 1;
    });
    return counts;
  }, [followedGames]);

  const handleFollow = (gameId: string) => {
    setFollowedGames((prev) => {
      const next = new Set(prev);
      next.add(gameId);
      return next;
    });
    toast.success("You'll get an alert 15 min before tip-off! 🔔");
  };

  const handleUnfollow = (gameId: string) => {
    setFollowedGames((prev) => {
      const next = new Set(prev);
      next.delete(gameId);
      return next;
    });
    toast("Game unfollowed.");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 circuit-pattern opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <div className="p-2 rounded-lg bg-gradient-brand">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Live Sports</h1>
            {liveCount > 0 && (
              <div className="flex items-center gap-1.5 ml-2 px-2.5 py-0.5 rounded-full bg-destructive/15 border border-destructive/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                </span>
                <span className="text-xs font-semibold text-destructive">{liveCount} Live Now</span>
              </div>
            )}
          </motion.div>
          <p className="text-sm text-muted-foreground max-w-lg">
            Today's games across NFL, NBA & MLB. Follow a game to get alerted 15 minutes before it starts.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Season Pass Tracker */}
        {user && (
          <SeasonPassTracker followedGameLeagues={followedByLeague} />
        )}

        <Tabs value={activeLeague} onValueChange={setActiveLeague}>
          <TabsList className="mb-6 bg-muted/50 flex-wrap h-auto gap-1 p-1">
            {LEAGUES.map((l) => (
              <TabsTrigger key={l.value} value={l.value} className="text-sm">
                {l.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGames.map((game, i) => (
              <ScoreboardCard
                key={game.id}
                game={game}
                index={i}
                isFollowed={followedGames.has(game.id)}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
              />
            ))}
          </div>

          {filteredGames.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No games scheduled for this league today.</p>
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default LiveSports;
