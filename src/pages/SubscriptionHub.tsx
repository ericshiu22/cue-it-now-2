import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Plus, Trash2, DollarSign, Tv, TrendingDown, ArrowRight, History, Wallet, Rocket,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import MinimalistChurnEmail from "@/components/emails/MinimalistChurnEmail";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { SERVICE_LIST, getService } from "@/lib/streaming-services";
import { getImageUrl } from "@/lib/tmdb";
import { formatDistanceToNow } from "date-fns";
import SubscriptionHealth, { type ServiceHealth } from "@/components/SubscriptionHealth";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

interface ActiveSub {
  id: string;
  service_name: string;
  monthly_cost: number;
  is_active: boolean;
}

interface SwapRecord {
  id: string;
  old_service: string;
  new_service: string;
  show_title: string;
  show_poster_path: string | null;
  monthly_savings: number;
  created_at: string;
}

const SubscriptionHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profileLoading, setProfileLoading] = useState(true);

  /* ── Subscription state ── */
  const [subs, setSubs] = useState<ActiveSub[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState("");
  const [newCost, setNewCost] = useState("");
  const [addingSub, setAddingSub] = useState(false);

  /* ── Swap history state ── */
  const [swaps, setSwaps] = useState<SwapRecord[]>([]);

  /* ── Health / Optimize state ── */
  const [healthItems, setHealthItems] = useState<ServiceHealth[]>([]);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);

  /* ── Fetch all data ── */
  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      const [subsRes, swapsRes] = await Promise.all([
        supabase.from("active_subscriptions").select("*").order("created_at", { ascending: true }) as any,
        supabase.from("service_swaps").select("id, old_service, new_service, show_title, show_poster_path, monthly_savings, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10) as any,
      ]);

      if (subsRes.data) setSubs(subsRes.data);
      if (swapsRes.data) setSwaps(swapsRes.data);
      setProfileLoading(false);
    };
    fetchAll();
  }, [user]);

  const addSubscription = async () => {
    if (!user || !newService) return;
    const cost = parseFloat(newCost);
    if (isNaN(cost) || cost < 0 || cost > 999) { toast.error("Enter a valid monthly cost (0–999)."); return; }
    setAddingSub(true);
    const { data, error } = await supabase.from("active_subscriptions").insert({ user_id: user.id, service_name: newService, monthly_cost: cost, is_active: true }).select().single() as any;
    setAddingSub(false);
    if (error) { if (error.code === "23505") toast.error("You already have this service."); else toast.error("Failed to add subscription."); return; }
    setSubs((prev) => [...prev, data]);
    setNewService(""); setNewCost(""); setShowAddForm(false);
    toast.success("Subscription added.");
  };

  const removeSubscription = async (id: string) => {
    const { error } = await supabase.from("active_subscriptions").delete().eq("id", id) as any;
    if (error) { toast.error("Failed to remove subscription."); return; }
    setSubs((prev) => prev.filter((s) => s.id !== id));
    toast.success("Subscription removed.");
  };

  if (!user) { navigate("/auth"); return null; }

  const availableServices = SERVICE_LIST.filter(
    (s) => !subs.some((sub) => sub.service_name.toLowerCase() === s.id.toLowerCase())
  );

  const totalMonthly = subs.reduce((sum, s) => sum + Number(s.monthly_cost), 0);
  const totalSwapSavings = swaps.reduce((sum, s) => sum + Number(s.monthly_savings), 0);
  const totalYearlySavings = totalSwapSavings * 12;


  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-2">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="text-gradient">Subscription Hub</span>
        </h1>
      </div>

      <main className="max-w-7xl mx-auto px-4 pb-16 space-y-6">
        {/* ── Combined Savings + Optimization Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 md:p-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-brand opacity-[0.06]" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {/* Optimization Circle */}
            {healthItems.length > 0 && (() => {
              const totalServices = healthItems.length;
              const redCount = healthItems.filter((h) => h.status === "red").length;
              const optimizedCount = totalServices - redCount;
              const progressPercent = Math.round((optimizedCount / totalServices) * 100);
              const isFullyOptimized = redCount === 0;
              const radius = 52;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

              return (
                <div className="relative flex-shrink-0">
                  <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
                    <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                    <circle
                      cx="70" cy="70" r={radius} fill="none"
                      strokeWidth="10"
                      strokeLinecap="round"
                      stroke={isFullyOptimized ? "hsl(145 70% 45%)" : "url(#progressGradient)"}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000 ease-out"
                      style={{
                        filter: isFullyOptimized
                          ? "drop-shadow(0 0 8px hsl(145 70% 45% / 0.6))"
                          : "drop-shadow(0 0 8px hsl(var(--brand-cyan) / 0.5))",
                      }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--brand-cyan))" />
                        <stop offset="100%" stopColor="hsl(var(--brand-purple))" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                    <span className="text-2xl font-black text-foreground">{progressPercent}%</span>
                    <span className="text-[10px] font-medium text-muted-foreground">{optimizedCount}/{totalServices} healthy</span>
                  </div>
                </div>
              );
            })()}

            {/* Savings Info */}
            <div className="flex-1 text-center md:text-left">
              <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Total Potential Savings</p>
              <h2
                className="text-4xl md:text-5xl font-black text-gradient"
                style={{ textShadow: "0 0 40px hsl(var(--brand-cyan) / 0.4), 0 0 80px hsl(var(--brand-purple) / 0.2)" }}
              >
                ${totalYearlySavings.toFixed(2)}
                <span className="text-xl text-muted-foreground font-semibold">/yr</span>
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
                <span className="text-sm text-muted-foreground">
                  Spending <span className="text-foreground font-semibold">${totalMonthly.toFixed(2)}/mo</span>
                </span>
                {totalSwapSavings > 0 && (
                  <span className="flex items-center gap-1 text-sm font-semibold text-[hsl(var(--brand-cyan))]">
                    <TrendingDown className="h-4 w-4" />
                    ${totalSwapSavings.toFixed(2)}/mo saved
                  </span>
                )}
              </div>
              {/* Status + Optimize button */}
              {healthItems.length > 0 && (() => {
                const redCount = healthItems.filter((h) => h.status === "red").length;
                const isFullyOptimized = redCount === 0;
                const mostUnderused = [...healthItems]
                  .filter((h) => h.status === "red")
                  .sort((a, b) => (a.cueCount - b.cueCount) || (b.monthlyCost - a.monthlyCost))[0];

                return (
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <p className="text-xs text-muted-foreground">
                      {isFullyOptimized
                        ? "All subscriptions actively used 🎉"
                        : `${redCount} service${redCount > 1 ? "s" : ""} idle 30+ days`}
                    </p>
                    {!isFullyOptimized && mostUnderused && (
                      <button
                        onClick={() => setShowOptimizeModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-purple))] text-white hover:opacity-90 transition-opacity shadow-[0_0_20px_hsl(var(--brand-cyan)_/_0.3)]"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        One-Tap Optimize
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </motion.div>

        {/* ── Two-column: Services + Swap History ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your Services */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Tv className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Your Services</h2>
                <span className="text-[11px] text-muted-foreground">
                  {subs.length} · ${totalMonthly.toFixed(2)}/mo
                </span>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="h-7 w-7 rounded-md bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors"
              >
                <Plus className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showAddForm ? "rotate-45" : ""}`} />
              </button>
            </div>

            <AnimatePresence>
              {showAddForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-2">
                    <select value={newService} onChange={(e) => setNewService(e.target.value)} className="w-full rounded-md bg-background border border-border px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                      <option value="">Select a service…</option>
                      {availableServices.map((s) => (<option key={s.id} value={s.id}>{s.logo} {s.name}</option>))}
                    </select>
                    <div className="flex gap-2">
                      <input type="number" min="0" max="999" step="0.01" value={newCost} onChange={(e) => setNewCost(e.target.value)} placeholder="$/mo" className="flex-1 rounded-md bg-background border border-border px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                      <button onClick={addSubscription} disabled={!newService || !newCost || addingSub} className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40">
                        {addingSub ? "…" : "Add"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {subs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No subscriptions yet. Tap + to add.</p>
            ) : (
              <div className="divide-y divide-border/30">
                <SubscriptionHealth onHealthData={setHealthItems} embedded subs={subs} onRemove={removeSubscription} />
              </div>
            )}
          </motion.div>

          {/* Service Swap History */}
          {swaps.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <History className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground">Swap History</h2>
                  <span className="text-[11px] text-muted-foreground">{swaps.length} swap{swaps.length !== 1 ? "s" : ""}</span>
                </div>
                {totalSwapSavings > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-[hsl(var(--brand-cyan))]">
                      <TrendingDown className="h-3 w-3" />
                      ${totalSwapSavings.toFixed(2)}/mo
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {swaps.map((swap, i) => {
                  const oldInfo = getService(swap.old_service);
                  const newInfo = getService(swap.new_service);
                  return (
                    <motion.div key={swap.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/40 transition-colors">
                      {swap.show_poster_path && (
                        <img src={getImageUrl(swap.show_poster_path, "w200") || ""} alt={swap.show_title} className="h-10 w-7 rounded object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{swap.show_title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{oldInfo?.logo} → {newInfo?.logo}</span>
                          {swap.monthly_savings > 0 && (
                            <span className="text-[10px] font-semibold text-[hsl(var(--brand-cyan))]">+${Number(swap.monthly_savings).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{formatDistanceToNow(new Date(swap.created_at), { addSuffix: true })}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

      </main>

      {/* One-Tap Optimize Modal */}
      <AnimatePresence>
        {showOptimizeModal && (() => {
          const mostUnderused = [...healthItems]
            .filter((h) => h.status === "red")
            .sort((a, b) => (a.cueCount - b.cueCount) || (b.monthlyCost - a.monthlyCost))[0];
          if (!mostUnderused) return null;
          const serviceInfo = getService(mostUnderused.serviceId);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowOptimizeModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                className="w-full max-w-[580px] max-h-[85vh] overflow-y-auto rounded-2xl border border-border shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 z-10 flex justify-end p-3">
                  <button
                    onClick={() => setShowOptimizeModal(false)}
                    className="h-8 w-8 rounded-full bg-muted/80 backdrop-blur flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <span className="text-foreground text-sm">✕</span>
                  </button>
                </div>
                <MinimalistChurnEmail
                  serviceName={serviceInfo?.name || mostUnderused.serviceName}
                  monthlyCost={`$${mostUnderused.monthlyCost.toFixed(2)}`}
                  showsWatched={0}
                  showsCued={mostUnderused.cueCount}
                  pauseUrl="#"
                  addShowUrl="/queue"
                />
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionHub;
