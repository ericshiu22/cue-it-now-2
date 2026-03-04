import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { GameData } from "@/lib/mock-sports-data";
import { getService } from "@/lib/streaming-services";

interface ScoreboardCardProps {
  game: GameData;
  index: number;
  isFollowed: boolean;
  onFollow: (gameId: string) => void;
  onUnfollow: (gameId: string) => void;
}

const leagueColors: Record<string, string> = {
  NBA: "from-orange-500/20 to-orange-600/5",
  NFL: "from-green-500/20 to-green-600/5",
  MLB: "from-blue-500/20 to-blue-600/5",
};

const leagueBadgeColors: Record<string, string> = {
  NBA: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  NFL: "bg-green-500/20 text-green-300 border-green-500/30",
  MLB: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

const ScoreboardCard = ({ game, index, isFollowed, onFollow, onUnfollow }: ScoreboardCardProps) => {
  const { user } = useAuth();
  const service = getService(game.streamingService);
  const isLive = game.status === "live";
  const isFinal = game.status === "final";

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const handleFollow = () => {
    if (!user) {
      toast.error("Sign in to follow games.");
      return;
    }
    if (isFollowed) {
      onUnfollow(game.id);
    } else {
      onFollow(game.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className={`relative glass rounded-xl overflow-hidden border border-border/50 hover:border-border transition-all group bg-gradient-to-br ${leagueColors[game.league] || ""}`}
    >
      {/* Live pulse */}
      {isLive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.5)]" />
          </span>
          <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Live</span>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${leagueBadgeColors[game.league]}`}>
          {game.league}
        </Badge>
        {isFinal && (
          <span className="text-[11px] text-muted-foreground font-medium">Final</span>
        )}
        {!isLive && !isFinal && (
          <span className="text-[11px] text-muted-foreground">{formatTime(game.startTime)}</span>
        )}
        {isLive && game.period && (
          <span className="text-[11px] text-muted-foreground">
            {game.period} · {game.clock}
          </span>
        )}
      </div>

      {/* Matchup */}
      <div className="px-4 pb-2 space-y-2">
        {/* Away team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{game.awayLogo}</span>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">{game.awayAbbr}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{game.awayTeam}</p>
            </div>
          </div>
          <span className={`text-lg font-bold tabular-nums ${game.awayScore !== null ? "text-foreground" : "text-muted-foreground/40"}`}>
            {game.awayScore ?? "—"}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-border/30" />

        {/* Home team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{game.homeLogo}</span>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">{game.homeAbbr}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{game.homeTeam}</p>
            </div>
          </div>
          <span className={`text-lg font-bold tabular-nums ${game.homeScore !== null ? "text-foreground" : "text-muted-foreground/40"}`}>
            {game.homeScore ?? "—"}
          </span>
        </div>
      </div>

      {/* Footer: broadcaster + follow */}
      <div className="px-4 py-2.5 border-t border-border/30 flex items-center justify-between bg-background/20">
        <div className="flex items-center gap-1.5">
          <Tv className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">{game.broadcaster}</span>
          {service && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1 border-primary/30 text-primary">
              {service.name}
            </Badge>
          )}
        </div>
        {!isFinal && (
          <Button
            size="sm"
            variant={isFollowed ? "secondary" : "default"}
            className={`h-7 text-xs gap-1 ${isFollowed ? "" : "bg-gradient-brand text-primary-foreground hover:opacity-90"}`}
            onClick={handleFollow}
          >
            {isFollowed ? <BellOff className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
            {isFollowed ? "Following" : "Follow"}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default ScoreboardCard;
