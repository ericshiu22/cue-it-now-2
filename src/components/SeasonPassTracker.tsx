import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Shield, Zap, Plus, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getService } from "@/lib/streaming-services";
import { toast } from "sonner";
import { SEASON_DATA, type SeasonInfo } from "@/lib/mock-sports-data";

interface SeasonPass {
  id: string;
  league: string;
  streaming_service: string;
  season_name: string;
  season_start: string;
  season_end: string;
  is_active: boolean;
  games_followed: number;
}

interface SeasonPassTrackerProps {
  followedGameLeagues?: Record<string, number>; // league -> count of followed games
  onSeasonEndAlert?: (pass: SeasonPass) => void;
}

const LEAGUE_EMOJI: Record<string, string> = { NFL: "🏈", NBA: "🏀", MLB: "⚾", NHL: "🏒", NCAAF: "🏈", WNBA: "🏀", NCAAM: "🏀", NCAAW: "🏀", F1: "🏎️", NASCAR: "🏁", Golf: "⛳" };

const SeasonPassTracker = ({ followedGameLeagues = {}, onSeasonEndAlert }: SeasonPassTrackerProps) => {
  const { user } = useAuth();
  const [passes, setPasses] = useState<SeasonPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestLeague, setSuggestLeague] = useState<string | null>(null);

  // Fetch existing season passes
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("season_passes")
        .select("*")
        .eq("is_active", true) as any;
      if (data) setPasses(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  // Auto-detect: suggest season pass when 3+ games followed in a league
  useEffect(() => {
    if (!user) return;
    const activeLeagues = passes.map((p) => p.league);
    for (const [league, count] of Object.entries(followedGameLeagues)) {
      if (count >= 3 && !activeLeagues.includes(league)) {
        setSuggestLeague(league);
        return;
      }
    }
    setSuggestLeague(null);
  }, [followedGameLeagues, passes, user]);

  // Check for ending seasons
  useEffect(() => {
    if (!onSeasonEndAlert) return;
    const now = new Date();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    passes.forEach((pass) => {
      const endDate = new Date(pass.season_end);
      if (endDate.getTime() - now.getTime() <= sevenDays && endDate.getTime() > now.getTime()) {
        onSeasonEndAlert(pass);
      }
    });
  }, [passes, onSeasonEndAlert]);

  const createSeasonPass = async (league: string) => {
    if (!user) return;
    const season = SEASON_DATA[league as keyof typeof SEASON_DATA];
    if (!season) return;

    const { data, error } = await supabase.from("season_passes").insert({
      user_id: user.id,
      league,
      streaming_service: season.primaryService,
      season_name: season.name,
      season_start: season.startDate,
      season_end: season.endDate,
      games_followed: followedGameLeagues[league] || 0,
    }).select().single() as any;

    if (error) {
      if (error.code === "23505") toast.error("You already have an active pass for this league.");
      else toast.error("Failed to create season pass.");
      return;
    }
    setPasses((prev) => [...prev, data]);
    setSuggestLeague(null);
    toast.success(`${league} Season Pass activated! 🎉`);
  };

  const removePass = async (id: string) => {
    await supabase.from("season_passes").delete().eq("id", id);
    setPasses((prev) => prev.filter((p) => p.id !== id));
    toast("Season pass removed.");
  };

  if (!user || loading) return null;

  const daysUntilEnd = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  };

  const seasonProgress = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const now = Date.now();
    if (now <= s) return 0;
    if (now >= e) return 100;
    return Math.round(((now - s) / (e - s)) * 100);
  };

  return (
    <div className="space-y-3">
      {/* Auto-suggest banner */}
      <AnimatePresence>
        {suggestLeague && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="p-2 rounded-lg bg-primary/20">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  You're following {followedGameLeagues[suggestLeague]}+ {suggestLeague} games!
                </p>
                <p className="text-xs text-muted-foreground">
                  Track the full {suggestLeague} season to get swap alerts when it ends.
                </p>
              </div>
              <button
                onClick={() => createSeasonPass(suggestLeague)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
              >
                <Plus className="h-3 w-3" />
                Track Season
              </button>
              <button
                onClick={() => setSuggestLeague(null)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active season passes */}
      {passes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Season Passes</span>
          </div>
          {passes.map((pass) => {
            const service = getService(pass.streaming_service);
            const progress = seasonProgress(pass.season_start, pass.season_end);
            const daysLeft = daysUntilEnd(pass.season_end);
            const isEnding = daysLeft <= 7;

            return (
              <motion.div
                key={pass.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isEnding
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-secondary/30 border-border/50"
                }`}
              >
                <span className="text-lg">{LEAGUE_EMOJI[pass.league] || "🏆"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{pass.season_name}</span>
                    {isEnding && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {daysLeft === 0 ? "ENDS TODAY" : `${daysLeft}d LEFT`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      via {service?.logo || "📺"} {service?.name || pass.streaming_service}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      · {pass.games_followed} games followed
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: isEnding ? "hsl(45, 90%, 55%)" : "hsl(var(--primary))",
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[9px] text-muted-foreground">{progress}% complete</span>
                    <span className="text-[9px] text-muted-foreground">
                      Ends {new Date(pass.season_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removePass(pass.id)}
                  className="p-1 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                  style={{ opacity: 1 }} // always show for now
                  aria-label="Remove season pass"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SeasonPassTracker;
