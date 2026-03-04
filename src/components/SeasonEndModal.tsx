import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Calendar, ExternalLink, X, Bell, BellOff } from "lucide-react";
import { getService } from "@/lib/streaming-services";

interface SeasonEndModalProps {
  open: boolean;
  onClose: () => void;
  league: string;
  seasonName: string;
  streamingService: string;
  monthlyCost?: number;
  seasonEndDate: string;
  onScheduleCancel: () => void;
  onKeep: () => void;
}

const LEAGUE_EMOJI: Record<string, string> = { NFL: "🏈", NBA: "🏀", MLB: "⚾" };

const SeasonEndModal = ({
  open,
  onClose,
  league,
  seasonName,
  streamingService,
  monthlyCost,
  seasonEndDate,
  onScheduleCancel,
  onKeep,
}: SeasonEndModalProps) => {
  const service = getService(streamingService);
  const endDate = new Date(seasonEndDate);
  const dayAfter = new Date(endDate);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const yearlySavings = monthlyCost ? (monthlyCost * 12).toFixed(2) : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with warning gradient */}
            <div className="relative p-6 pb-4 bg-gradient-to-b from-amber-500/10 to-transparent">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Season Ending Soon</h2>
                  <p className="text-xs text-muted-foreground">Swap Alert</p>
                </div>
              </div>

              {/* Season badge */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border/50">
                <span className="text-2xl">{LEAGUE_EMOJI[league] || "🏆"}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{seasonName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Ends {endDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 pb-2">
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-3">
                <p className="text-sm text-foreground leading-relaxed">
                  You're paying for{" "}
                  <span className="font-semibold">
                    {service?.logo} {service?.name || streamingService}
                  </span>{" "}
                  {monthlyCost ? (
                    <span className="text-muted-foreground">
                      (${monthlyCost.toFixed(2)}/mo)
                    </span>
                  ) : null}{" "}
                  primarily for {league} games. The season ends this{" "}
                  {endDate.toLocaleDateString("en-US", { weekday: "long" })}.
                </p>

                <p className="text-sm font-medium text-foreground">
                  Would you like to schedule a cancellation for{" "}
                  {dayAfter.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}?
                </p>

                {yearlySavings && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-xs font-semibold text-emerald-400">
                      💰 Potential savings: ${monthlyCost?.toFixed(2)}/mo · ${yearlySavings}/yr
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-4 space-y-2">
              <button
                onClick={onScheduleCancel}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/20"
              >
                <BellOff className="h-4 w-4" />
                Schedule Cancellation
                {service?.cancelUrl && <ExternalLink className="h-3 w-3 ml-1 opacity-60" />}
              </button>

              <button
                onClick={onKeep}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary/60 text-foreground font-medium text-sm hover:bg-secondary transition-colors"
              >
                <Bell className="h-4 w-4" />
                Keep — I'll watch other content
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SeasonEndModal;
