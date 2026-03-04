import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ArrowLeft, MapPin, Tv, BellOff, Play, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { ALL_SPORTS_TEAMS, type TeamOption } from "@/lib/all-sports-teams";
import { generateTeamSchedule } from "@/lib/generate-team-schedule";
import { getService } from "@/lib/streaming-services";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { GameData } from "@/lib/mock-sports-data";

interface Props {
  followedGames: Set<string>;
  onFollow: (gameId: string) => void;
  onUnfollow: (gameId: string) => void;
  userServiceIds: Set<string>;
  isFavorite: (abbr: string) => boolean;
  onAddFavorite: (abbr: string, league: string) => void;
  onRemoveFavorite: (abbr: string) => void;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const TeamScheduleSearch = ({ followedGames, onFollow, onUnfollow, userServiceIds, isFavorite, onAddFavorite, onRemoveFavorite }: Props) => {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return ALL_SPORTS_TEAMS.filter((t) => {
      const haystack = `${t.name} ${t.abbr} ${t.league}`.toLowerCase();
      return words.every((w) => haystack.includes(w));
    }).slice(0, 12);
  }, [query]);

  const schedule = useMemo(() => {
    if (!selectedTeam) return [];
    return generateTeamSchedule(selectedTeam);
  }, [selectedTeam]);

  // Group games by date
  const groupedSchedule = useMemo(() => {
    const groups: Record<string, GameData[]> = {};
    for (const game of schedule) {
      const key = formatDate(game.startTime);
      if (!groups[key]) groups[key] = [];
      groups[key].push(game);
    }
    return groups;
  }, [schedule]);

  const handleFollow = (gameId: string) => {
    if (!user) {
      toast.error("Sign in to add games to your queue.");
      return;
    }
    if (followedGames.has(gameId)) {
      onUnfollow(gameId);
    } else {
      onFollow(gameId);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search / Back header */}
      <div className="flex items-center gap-2">
        {selectedTeam ? (
          <>
            <button
              onClick={() => { setSelectedTeam(null); setQuery(""); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedTeam.emoji}</span>
              <div>
                <h3 className="text-sm font-bold text-foreground">{selectedTeam.name}</h3>
                <p className="text-[11px] text-muted-foreground">{selectedTeam.league} · Upcoming 2 weeks</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search a team to view upcoming schedule…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-8 pr-8 text-xs bg-background"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search results */}
      <AnimatePresence>
        {!selectedTeam && query.trim().length > 0 && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-lg border border-border/50 bg-muted/30 p-2 space-y-0.5"
          >
          {filtered.map((team) => {
              const fav = isFavorite(team.abbr);
              return (
                <div
                  key={`${team.abbr}-${team.league}`}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left hover:bg-muted transition-colors"
                >
                  <button
                    onClick={() => { setSelectedTeam(team); setQuery(""); }}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                  >
                    <span className="text-base">{team.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{team.name}</p>
                      <p className="text-[11px] text-muted-foreground">{team.league}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                      {team.abbr}
                    </Badge>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (fav) onRemoveFavorite(team.abbr);
                      else onAddFavorite(team.abbr, team.league);
                    }}
                    className={`shrink-0 p-1.5 rounded-md transition-colors ${
                      fav
                        ? "text-primary bg-primary/10 hover:bg-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    title={fav ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star className={`h-3.5 w-3.5 ${fav ? "fill-current" : ""}`} />
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results */}
      {!selectedTeam && query.trim().length > 0 && filtered.length === 0 && (
        <p className="text-xs text-muted-foreground px-1">No teams found for "{query}"</p>
      )}

      {/* Schedule view */}
      <AnimatePresence>
        {selectedTeam && schedule.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {Object.entries(groupedSchedule).map(([date, games]) => (
              <div key={date}>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                  {date}
                </p>
                <div className="space-y-2">
                  {games.map((game, i) => {
                    const service = getService(game.streamingService);
                    const isFollowed = followedGames.has(game.id);
                    const hasService = userServiceIds.has(game.streamingService.toLowerCase());
                    const isOpponent = game.homeAbbr === selectedTeam.abbr;
                    const opponentName = isOpponent ? game.awayTeam : game.homeTeam;
                    const opponentAbbr = isOpponent ? game.awayAbbr : game.homeAbbr;
                    const venue = isOpponent ? "vs" : "@";

                    return (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/50 bg-background/50 hover:border-border transition-all group"
                      >
                        {/* Time */}
                        <div className="w-16 shrink-0 text-center">
                          <p className="text-xs font-semibold text-foreground">{formatTime(game.startTime)}</p>
                        </div>

                        {/* Matchup */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            <span className="text-muted-foreground">{venue}</span>{" "}
                            {opponentName}
                            <span className="text-muted-foreground ml-1 text-xs">({opponentAbbr})</span>
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Tv className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground">{game.broadcaster}</span>
                            {service && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${
                                  hasService
                                    ? "border-primary/30 text-primary"
                                    : "border-border text-muted-foreground"
                                }`}
                              >
                                {service.name}
                                {hasService && " ✓"}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* CTA */}
                        <button
                          onClick={() => handleFollow(game.id)}
                          className={`shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity glow ${
                            isFollowed
                              ? "bg-secondary text-foreground"
                              : "bg-primary text-primary-foreground hover:opacity-90"
                          }`}
                        >
                          {isFollowed ? (
                            <>
                              <BellOff className="h-3 w-3" />
                              Queued
                            </>
                          ) : (
                            <>🎬 Cue It</>
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamScheduleSearch;
