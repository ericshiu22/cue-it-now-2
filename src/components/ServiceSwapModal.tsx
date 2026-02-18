import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRightLeft, CheckCircle2, ExternalLink, Sparkles, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getImageUrl, type TMDBResult, type WatchProvider } from "@/lib/tmdb";
import { getService } from "@/lib/streaming-services";
import { addCue } from "@/lib/cue-actions";

interface UnderusedSub {
  serviceName: string;
  monthlyCost: number;
  cueCount: number;
}

interface ServiceSwapModalProps {
  open: boolean;
  onClose: () => void;
  show: TMDBResult;
  targetProvider: WatchProvider;
  targetServiceId: string;
}

const ServiceSwapModal = ({ open, onClose, show, targetProvider, targetServiceId }: ServiceSwapModalProps) => {
  const { user } = useAuth();
  const [underused, setUnderused] = useState<UnderusedSub | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChecklist, setShowChecklist] = useState(false);
  const [cued, setCued] = useState(false);
  const [saving, setSaving] = useState(false);

  const title = show.title || show.name || "Unknown";
  const targetServiceInfo = getService(targetServiceId);
  const targetDisplayName = targetServiceInfo?.name || targetProvider.provider_name;

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    setShowChecklist(false);
    setCued(false);

    const fetchUnderused = async () => {
      try {
        const { data: subs } = await supabase
          .from("active_subscriptions")
          .select("service_name, monthly_cost")
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (!subs || subs.length === 0) { setLoading(false); return; }

        // Count cues per service in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentCues } = await supabase
          .from("cues")
          .select("service_provider")
          .eq("user_id", user.id)
          .gte("created_at", thirtyDaysAgo.toISOString());

        const cueCount: Record<string, number> = {};
        for (const c of recentCues || []) {
          const svc = c.service_provider?.toLowerCase() || "";
          cueCount[svc] = (cueCount[svc] || 0) + 1;
        }

        // Find least active subscription
        let least: UnderusedSub | null = null;
        for (const s of subs) {
          const name = s.service_name.toLowerCase();
          const count = cueCount[name] || 0;
          if (!least || count < least.cueCount || (count === least.cueCount && s.monthly_cost > least.monthlyCost)) {
            least = { serviceName: name, monthlyCost: s.monthly_cost, cueCount: count };
          }
        }
        setUnderused(least);
      } catch (err) {
        console.error("Failed to fetch underused sub:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUnderused();
  }, [open, user]);

  const handleCueAnyway = async () => {
    if (cued || saving) return;
    setSaving(true);
    const year = (show.release_date || show.first_air_date || "").slice(0, 4);
    const ok = await addCue({
      tmdb_id: show.id,
      title,
      poster_path: show.poster_path,
      media_type: show.media_type,
      vote_average: show.vote_average,
      release_year: year,
      overview: show.overview,
      service_provider: "needs subscription",
    });
    setSaving(false);
    if (ok) setCued(true);
  };

  const underusedInfo = underused ? getService(underused.serviceName) : null;
  const underusedDisplayName = underusedInfo?.name || underused?.serviceName || "";
  const savings = underused?.monthlyCost || 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[hsl(var(--brand-purple)_/_0.5)] backdrop-blur-md" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
          >
            {/* Outer glow */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[hsl(var(--brand-cyan)_/_0.4)] to-[hsl(var(--brand-purple)_/_0.2)]" />

            <div className="relative glass-strong rounded-2xl p-6 ring-1 ring-[hsl(var(--brand-cyan)_/_0.2)]">
              {/* Savings badge */}
              {!loading && underused && savings > 0 && (
                <div className="absolute top-4 right-12 flex items-center gap-1 bg-[hsl(var(--brand-cyan)_/_0.15)] text-[hsl(var(--brand-cyan))] text-xs font-bold px-2.5 py-1 rounded-full ring-1 ring-[hsl(var(--brand-cyan)_/_0.3)]">
                  <Sparkles className="h-3 w-3" />
                  Save ${savings}/mo
                </div>
              )}

              {/* Close */}
              <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 ring-1 ring-[hsl(var(--brand-cyan)_/_0.3)] shadow-[0_0_8px_hsl(var(--brand-cyan)_/_0.2)]">
                  <img
                    src={getImageUrl(targetProvider.logo_path, "w200") || ""}
                    alt={targetProvider.provider_name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg leading-tight">{title}</h3>
                  <p className="text-xs text-[hsl(var(--brand-cyan))] font-medium">Available on {targetDisplayName}</p>
                </div>
              </div>

              {/* Comparison */}
              {!loading && underused && (
                <div className="mb-5 p-4 rounded-xl bg-[hsl(var(--brand-purple)_/_0.15)] ring-1 ring-[hsl(var(--brand-purple)_/_0.2)]">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowRightLeft className="h-4 w-4 text-[hsl(var(--brand-cyan))]" />
                    <span className="text-sm font-semibold text-foreground">Smart Swap Suggestion</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You have <span className="font-semibold text-foreground capitalize">{underusedDisplayName}</span>
                    {underused.cueCount === 0
                      ? ", but you haven't used it in the last 30 days"
                      : `, but you've only cued ${underused.cueCount} show${underused.cueCount > 1 ? "s" : ""} from it recently`
                    }. Swap it for <span className="font-semibold text-[hsl(var(--brand-cyan))]">{targetDisplayName}</span> to watch this show
                    {savings > 0 && <> and save <span className="font-bold text-[hsl(var(--brand-cyan))]">${savings}/mo</span></>}.
                  </p>
                </div>
              )}

              {loading && (
                <div className="mb-5 p-4 rounded-xl bg-secondary/30 animate-pulse h-24" />
              )}

              {/* Checklist */}
              <AnimatePresence>
                {showChecklist && underused && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-5"
                  >
                    <div className="p-4 rounded-xl bg-[hsl(var(--brand-cyan)_/_0.05)] ring-1 ring-[hsl(var(--brand-cyan)_/_0.15)] space-y-4">
                      <h4 className="text-sm font-bold text-foreground">Swap in 3 Steps</h4>

                      {/* Step 1 */}
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-6 w-6 rounded-full bg-[hsl(var(--brand-cyan)_/_0.15)] flex items-center justify-center shrink-0 ring-1 ring-[hsl(var(--brand-cyan)_/_0.3)]">
                            <span className="text-[10px] font-bold text-[hsl(var(--brand-cyan))]">1</span>
                          </div>
                          <div className="w-px h-full min-h-[16px] bg-[hsl(var(--brand-cyan)_/_0.2)]" />
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Cancel your underused service</span>
                          <a
                            href={underusedInfo?.searchUrl("account") || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--brand-cyan))] hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Go to {underusedDisplayName}
                          </a>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-6 w-6 rounded-full bg-[hsl(var(--brand-cyan)_/_0.15)] flex items-center justify-center shrink-0 ring-1 ring-[hsl(var(--brand-cyan)_/_0.3)]">
                            <span className="text-[10px] font-bold text-[hsl(var(--brand-cyan))]">2</span>
                          </div>
                          <div className="w-px h-full min-h-[16px] bg-[hsl(var(--brand-cyan)_/_0.2)]" />
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Sign up for the new service</span>
                          <a
                            href={targetServiceInfo?.searchUrl(title) || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--brand-cyan))] hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Go to {targetDisplayName}
                          </a>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-[hsl(var(--brand-cyan)_/_0.15)] flex items-center justify-center shrink-0 ring-1 ring-[hsl(var(--brand-cyan)_/_0.3)]">
                          <span className="text-[10px] font-bold text-[hsl(var(--brand-cyan))]">3</span>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Update your subscriptions here</span>
                          <button
                            onClick={() => { onClose(); window.location.href = "/profile"; }}
                            className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--brand-cyan))] hover:underline"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Refresh My Subscriptions
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="space-y-2.5">
                {underused && !showChecklist && (
                  <button
                    onClick={() => setShowChecklist(true)}
                    className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-purple))] text-white hover:opacity-90 transition-opacity shadow-[0_0_20px_hsl(var(--brand-cyan)_/_0.3)] flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Guide Me to Swap
                  </button>
                )}
                {showChecklist && (
                  <button
                    onClick={() => setShowChecklist(false)}
                    className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-purple))] text-white hover:opacity-90 transition-opacity shadow-[0_0_20px_hsl(var(--brand-cyan)_/_0.3)] flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Got It!
                  </button>
                )}
                <button
                  onClick={handleCueAnyway}
                  disabled={cued || saving}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ring-1 flex items-center justify-center gap-2 ${
                    cued
                      ? "bg-secondary text-foreground ring-border"
                      : "bg-secondary/50 text-foreground ring-[hsl(var(--brand-purple)_/_0.3)] hover:bg-secondary/80"
                  }`}
                >
                  {cued ? (
                    <><CheckCircle2 className="h-4 w-4" /> Cued as "Needs Subscription"</>
                  ) : saving ? "Saving..." : (
                    <>🎬 Just Cue It Anyway</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ServiceSwapModal;
