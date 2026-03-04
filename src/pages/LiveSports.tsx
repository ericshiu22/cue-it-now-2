import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, Trophy, MapPin } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScoreboardCard from "@/components/ScoreboardCard";
import SeasonPassTracker from "@/components/SeasonPassTracker";
import { MOCK_GAMES } from "@/lib/mock-sports-data";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { findLocalMarket, isLocalGame, isBlackedOut } from "@/lib/local-sports-data";
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
  const location = useUserLocation();
  const localMarket = useMemo(() => findLocalMarket(location.city), [location.city]);

  const filteredGames = useMemo(() => {
    const games = activeLeague === "all"
      ? MOCK_GAMES
      : MOCK_GAMES.filter((g) => g.league === activeLeague);

    const statusOrder = { live: 0, scheduled: 1, final: 2 };
    const localTeams = localMarket?.teams || [];

    return [...games].sort((a, b) => {
      const aLocal = isLocalGame(a.homeAbbr, a.awayAbbr, localTeams) ? 0 : 1;
      const bLocal = isLocalGame(b.homeAbbr, b.awayAbbr, localTeams) ? 0 : 1;
      // Local games first, then by status
      if (aLocal !== bLocal) return aLocal - bLocal;
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [activeLeague, localMarket]);

  const liveCount = MOCK_GAMES.filter((g) => g.status === "live").length;

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

          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground max-w-lg">
              Today's games across NFL, NBA & more. Follow a game to get alerted 15 minutes before it starts.
            </p>
            {/* Location indicator */}
            {location.city && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 shrink-0"
              >
                <MapPin className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">
                  {location.city}{location.state ? `, ${location.state}` : ""}
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {user && (
          <SeasonPassTracker followedGameLeagues={followedByLeague} />
        )}

        {/* Local team prioritization notice */}
        {localMarket && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15 text-xs text-muted-foreground"
          >
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>
              Showing <span className="font-semibold text-foreground">{localMarket.city}</span> teams first.
              {localMarket.blackoutBroadcasters.length > 0 && " Regional blackout restrictions may apply to local games."}
            </span>
          </motion.div>
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
            {filteredGames.map((game, i) => {
              const gameIsLocal = localMarket
                ? isLocalGame(game.homeAbbr, game.awayAbbr, localMarket.teams)
                : false;
              const gameIsBlackedOut = isBlackedOut(
                game.broadcaster,
                game.status,
                localMarket,
                gameIsLocal
              );
              return (
                <ScoreboardCard
                  key={game.id}
                  game={game}
                  index={i}
                  isFollowed={followedGames.has(game.id)}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                  isLocalGame={gameIsLocal}
                  isBlackedOut={gameIsBlackedOut}
                />
              );
            })}
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
