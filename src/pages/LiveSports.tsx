import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Trophy, MapPin, ChevronDown, Wifi } from "lucide-react";
import ScoreboardCard from "@/components/ScoreboardCard";
import SeasonPassTracker from "@/components/SeasonPassTracker";
import FavoriteTeamsPicker from "@/components/FavoriteTeamsPicker";
import { MOCK_GAMES } from "@/lib/mock-sports-data";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useWatchmode } from "@/hooks/useWatchmode";
import { useFavoriteTeams } from "@/hooks/useFavoriteTeams";
import { findLocalMarket, isLocalGame, isBlackedOut } from "@/lib/local-sports-data";
import { toast } from "sonner";

interface SportCategory {
  label: string;
  emoji: string;
  leagues: { value: string; label: string }[];
}

const SPORT_CATEGORIES: SportCategory[] = [
  {
    label: "Football",
    emoji: "🏈",
    leagues: [
      { value: "NFL", label: "NFL" },
      { value: "NCAAF", label: "NCAAF" },
    ],
  },
  {
    label: "Basketball",
    emoji: "🏀",
    leagues: [
      { value: "NBA", label: "NBA" },
      { value: "WNBA", label: "WNBA" },
      { value: "NCAAM", label: "NCAAM" },
      { value: "NCAAW", label: "NCAAW" },
    ],
  },
  {
    label: "Baseball",
    emoji: "⚾",
    leagues: [{ value: "MLB", label: "MLB" }],
  },
  {
    label: "Hockey",
    emoji: "🏒",
    leagues: [{ value: "NHL", label: "NHL" }],
  },
  {
    label: "Soccer",
    emoji: "⚽",
    leagues: [
      { value: "MLS", label: "MLS" },
      { value: "EPL", label: "EPL" },
      { value: "La Liga", label: "La Liga" },
      { value: "Liga MX", label: "Liga MX" },
      { value: "UCL", label: "UCL" },
    ],
  },
  {
    label: "Motorsports",
    emoji: "🏎️",
    leagues: [
      { value: "F1", label: "F1" },
      { value: "NASCAR", label: "NASCAR" },
    ],
  },
  {
    label: "Golf",
    emoji: "⛳",
    leagues: [{ value: "Golf", label: "PGA Tour" }],
  },
];

/** Dropdown for a sport category with multiple leagues */
const SportDropdown = ({
  category,
  activeLeague,
  onSelect,
}: {
  category: SportCategory;
  activeLeague: string;
  onSelect: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = category.leagues.some((l) => l.value === activeLeague);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Single-league category — just a button, no dropdown
  if (category.leagues.length === 1) {
    const league = category.leagues[0];
    return (
      <button
        onClick={() => onSelect(league.value)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <span>{category.emoji}</span>
        <span>{league.label}</span>
      </button>
    );
  }

  const activeInCategory = category.leagues.find((l) => l.value === activeLeague);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <span>{category.emoji}</span>
        <span>{activeInCategory ? activeInCategory.label : category.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1.5 z-50 min-w-[140px] rounded-lg border border-border bg-popover shadow-lg p-1"
          >
            {category.leagues.map((league) => (
              <button
                key={league.value}
                onClick={() => {
                  onSelect(league.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                  activeLeague === league.value
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {league.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LiveSports = () => {
  const { user } = useAuth();
  const [activeLeague, setActiveLeague] = useState("all");
  const [followedGames, setFollowedGames] = useState<Set<string>>(new Set());
  const location = useUserLocation();
  const localMarket = useMemo(() => findLocalMarket(location.city), [location.city]);
  const { sources: watchmodeSources, loading: watchmodeLoading } = useWatchmode("US");
  const { favorites, addFavorite, removeFavorite, isFavorite, favoriteAbbrs } = useFavoriteTeams();

  const filteredGames = useMemo(() => {
    const games =
      activeLeague === "all"
        ? MOCK_GAMES
        : MOCK_GAMES.filter((g) => g.league === activeLeague);

    const statusOrder = { live: 0, scheduled: 1, final: 2 };
    const localTeams = localMarket?.teams || [];

    return [...games].sort((a, b) => {
      // Favorite teams first
      const aFav = (favoriteAbbrs.has(a.homeAbbr) || favoriteAbbrs.has(a.awayAbbr)) ? 0 : 1;
      const bFav = (favoriteAbbrs.has(b.homeAbbr) || favoriteAbbrs.has(b.awayAbbr)) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      // Then local teams
      const aLocal = isLocalGame(a.homeAbbr, a.awayAbbr, localTeams) ? 0 : 1;
      const bLocal = isLocalGame(b.homeAbbr, b.awayAbbr, localTeams) ? 0 : 1;
      if (aLocal !== bLocal) return aLocal - bLocal;
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [activeLeague, localMarket, favoriteAbbrs]);

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
            {location.city && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 shrink-0"
              >
                <MapPin className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">
                  {location.city}
                  {location.state ? `, ${location.state}` : ""}
                </span>
              </motion.div>
            )}
            {!watchmodeLoading && watchmodeSources && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                <Wifi className="h-3 w-3 text-emerald-500" />
                <span className="text-[11px] font-medium text-emerald-500">Watchmode Live</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {user && <SeasonPassTracker followedGameLeagues={followedByLeague} />}

        {user && (
          <FavoriteTeamsPicker
            favorites={favorites}
            onAdd={addFavorite}
            onRemove={removeFavorite}
            isFavorite={isFavorite}
          />
        )}

        {localMarket && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15 text-xs text-muted-foreground"
          >
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>
              Showing{" "}
              <span className="font-semibold text-foreground">{localMarket.city}</span> teams
              first.
              {localMarket.blackoutBroadcasters.length > 0 &&
                " Regional blackout restrictions may apply to local games."}
            </span>
          </motion.div>
        )}

        {/* Sport category filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveLeague("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeLeague === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All Sports
          </button>

          {SPORT_CATEGORIES.map((cat) => (
            <SportDropdown
              key={cat.label}
              category={cat}
              activeLeague={activeLeague}
              onSelect={setActiveLeague}
            />
          ))}
        </div>

        {/* Games grid */}
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
            const gameIsFavorite = favoriteAbbrs.has(game.homeAbbr) || favoriteAbbrs.has(game.awayAbbr);
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
                isFavoriteGame={gameIsFavorite}
                watchmodeSources={watchmodeSources}
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
      </div>
    </div>
  );
};

export default LiveSports;
