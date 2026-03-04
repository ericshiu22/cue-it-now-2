import { motion } from "framer-motion";
import { Bell, BellOff, Tv, Flag, MapPin, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { GameData } from "@/lib/mock-sports-data";
import { getService } from "@/lib/streaming-services";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScoreboardCardProps {
  game: GameData;
  index: number;
  isFollowed: boolean;
  onFollow: (gameId: string) => void;
  onUnfollow: (gameId: string) => void;
  isLocalGame?: boolean;
  isBlackedOut?: boolean;
}

const leagueColors: Record<string, string> = {
  NBA: "from-orange-500/20 to-orange-600/5",
  NFL: "from-green-500/20 to-green-600/5",
  MLB: "from-blue-500/20 to-blue-600/5",
  NHL: "from-cyan-500/20 to-cyan-600/5",
  NCAAF: "from-red-500/20 to-red-600/5",
  WNBA: "from-pink-500/20 to-pink-600/5",
  NCAAM: "from-indigo-500/20 to-indigo-600/5",
  NCAAW: "from-violet-500/20 to-violet-600/5",
  F1: "from-red-600/20 to-red-700/5",
  NASCAR: "from-yellow-500/20 to-yellow-600/5",
  Golf: "from-emerald-500/20 to-emerald-600/5",
  MLS: "from-teal-500/20 to-teal-600/5",
  "Liga MX": "from-lime-500/20 to-lime-600/5",
  EPL: "from-purple-500/20 to-purple-600/5",
  "La Liga": "from-amber-500/20 to-amber-600/5",
  UCL: "from-sky-500/20 to-sky-600/5",
};

const leagueBadgeColors: Record<string, string> = {
  NBA: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  NFL: "bg-green-500/20 text-green-300 border-green-500/30",
  MLB: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  NHL: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  NCAAF: "bg-red-500/20 text-red-300 border-red-500/30",
  WNBA: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  NCAAM: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  NCAAW: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  F1: "bg-red-600/20 text-red-300 border-red-600/30",
  NASCAR: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Golf: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  MLS: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  "Liga MX": "bg-lime-500/20 text-lime-300 border-lime-500/30",
  EPL: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "La Liga": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  UCL: "bg-sky-500/20 text-sky-300 border-sky-500/30",
};

const LocalBadge = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30 gap-0.5">
          <MapPin className="h-2.5 w-2.5" />
          Local
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        Your local team based on your current location
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const BlackoutBadge = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/30 gap-0.5">
          <ShieldAlert className="h-2.5 w-2.5" />
          Blackout
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[200px]">
        This game may be blacked out on streaming in your area due to regional broadcast restrictions
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const ScoreboardCard = ({ game, index, isFollowed, onFollow, onUnfollow, isLocalGame: isLocal, isBlackedOut: blackout }: ScoreboardCardProps) => {
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
    if (isFollowed) onUnfollow(game.id);
    else onFollow(game.id);
  };

  const localHighlight = isLocal ? "ring-1 ring-primary/25" : "";

  // Event-style card (F1, NASCAR, Golf)
  if (game.isEvent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.07, duration: 0.4 }}
        className={`relative glass rounded-xl overflow-hidden border border-border/50 hover:border-border transition-all group bg-gradient-to-br ${leagueColors[game.league] || ""} ${localHighlight}`}
      >
        {isLive && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive shadow-[0_0_8px_2px_hsl(var(--destructive)/0.5)]" />
            </span>
            <span className="text-[11px] font-bold text-destructive uppercase tracking-wider">Live</span>
          </div>
        )}

        <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${leagueBadgeColors[game.league]}`}>
            {game.league}
          </Badge>
          {isLocal && <LocalBadge />}
          {blackout && <BlackoutBadge />}
          {isFinal && <span className="text-[11px] text-muted-foreground font-medium">Final</span>}
          {!isLive && !isFinal && <span className="text-[11px] text-muted-foreground">{formatTime(game.startTime)}</span>}
          {isLive && game.period && <span className="text-[11px] text-muted-foreground">{game.period}</span>}
        </div>

        <div className="px-4 pb-3 space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{game.homeLogo}</span>
            <div>
              <p className="text-sm font-bold text-foreground">{game.eventName}</p>
              {game.eventRound && <p className="text-[11px] text-muted-foreground">{game.eventRound}</p>}
            </div>
          </div>

          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{game.homeAbbr}</span>
            <span>vs</span>
            <span className="font-medium text-foreground">{game.awayAbbr}</span>
            <span className="text-muted-foreground/60">+ field</span>
          </div>

          {game.position && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <Flag className="h-3 w-3 text-primary" />
              <span className="font-semibold text-primary">{game.position}</span>
            </div>
          )}
        </div>

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
  }

  // Standard team vs team card
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className={`relative glass rounded-xl overflow-hidden border border-border/50 hover:border-border transition-all group bg-gradient-to-br ${leagueColors[game.league] || ""} ${localHighlight}`}
    >
      {isLive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive shadow-[0_0_8px_2px_hsl(var(--destructive)/0.5)]" />
          </span>
          <span className="text-[11px] font-bold text-destructive uppercase tracking-wider">Live</span>
        </div>
      )}

      <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${leagueBadgeColors[game.league]}`}>
          {game.league}
        </Badge>
        {isLocal && <LocalBadge />}
        {blackout && <BlackoutBadge />}
        {isFinal && <span className="text-[11px] text-muted-foreground font-medium">Final</span>}
        {!isLive && !isFinal && <span className="text-[11px] text-muted-foreground">{formatTime(game.startTime)}</span>}
        {isLive && game.period && (
          <span className="text-[11px] text-muted-foreground">{game.period} · {game.clock}</span>
        )}
      </div>

      <div className="px-4 pb-2 space-y-2">
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

        <div className="border-t border-border/30" />

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
