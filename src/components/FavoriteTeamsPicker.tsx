import { useState, useMemo } from "react";
import { Star, X, ChevronDown, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MOCK_GAMES } from "@/lib/mock-sports-data";
import type { FavoriteTeam } from "@/hooks/useFavoriteTeams";

interface TeamOption {
  abbr: string;
  name: string;
  league: string;
  emoji: string;
}

const ALL_TEAMS: TeamOption[] = (() => {
  const seen = new Set<string>();
  const teams: TeamOption[] = [];
  for (const g of MOCK_GAMES) {
    if (g.isEvent) continue;
    for (const side of ["home", "away"] as const) {
      const abbr = side === "home" ? g.homeAbbr : g.awayAbbr;
      const name = side === "home" ? g.homeTeam : g.awayTeam;
      if (!seen.has(abbr)) {
        seen.add(abbr);
        teams.push({ abbr, name, league: g.league, emoji: g.homeLogo });
      }
    }
  }
  return teams.sort((a, b) => a.name.localeCompare(b.name));
})();

interface Props {
  favorites: FavoriteTeam[];
  onAdd: (abbr: string, league: string) => void;
  onRemove: (abbr: string) => void;
  isFavorite: (abbr: string) => boolean;
}

const FavoriteTeamsPicker = ({ favorites, onAdd, onRemove, isFavorite }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_TEAMS;
    const q = query.toLowerCase();
    return ALL_TEAMS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.abbr.toLowerCase().includes(q) ||
        t.league.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          onClick={() => { setOpen((p) => !p); setQuery(""); }}
        >
          <Star className="h-3.5 w-3.5" />
          My Teams
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>

        <AnimatePresence>
          {favorites.map((f) => (
            <motion.div
              key={f.team_abbr}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Badge
                variant="outline"
                className="text-xs px-2 py-0.5 gap-1 bg-primary/10 text-primary border-primary/30 cursor-pointer hover:bg-primary/20"
                onClick={() => onRemove(f.team_abbr)}
              >
                ⭐ {f.team_abbr}
                <X className="h-3 w-3 ml-0.5" />
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search teams by name, abbreviation, or league…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                  autoFocus
                />
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {filtered.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2 px-1">No teams found for "{query}"</p>
                )}
                {filtered.map((team) => {
                  const fav = isFavorite(team.abbr);
                  return (
                    <button
                      key={team.abbr}
                      onClick={() => fav ? onRemove(team.abbr) : onAdd(team.abbr, team.league)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all ${
                        fav
                          ? "bg-primary/15 text-primary border border-primary/30 font-medium"
                          : "bg-background border border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                      }`}
                    >
                      <span>{team.emoji}</span>
                      <span>{team.abbr}</span>
                      <span className="hidden sm:inline text-muted-foreground">· {team.name}</span>
                      {fav && <Star className="h-2.5 w-2.5 fill-current" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FavoriteTeamsPicker;
