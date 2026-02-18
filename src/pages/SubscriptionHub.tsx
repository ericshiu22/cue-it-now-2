import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Zap, Shield, Mail, Smartphone, AlertTriangle,
  Plus, Trash2, DollarSign, Tv, TrendingDown, ArrowRight, History, Wallet, Rocket,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import MinimalistChurnEmail from "@/components/emails/MinimalistChurnEmail";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { SERVICE_LIST, getService } from "@/lib/streaming-services";
import { getImageUrl } from "@/lib/tmdb";
import { formatDistanceToNow } from "date-fns";
import SubscriptionHealth, { type ServiceHealth } from "@/components/SubscriptionHealth";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

/* ── Constants ── */
const ALERT_LEVELS = [
  {
    id: "minimalist",
    label: "Minimalist",
    icon: Shield,
    description: "We only nudge you to save money. You'll get one weekly digest and critical price‑drop alerts—nothing more.",
  },
  {
    id: "balanced",
    label: "Balanced",
    icon: Zap,
    description: "A healthy mix. You'll receive price alerts, new‑release pings for queued titles, and a weekly roundup.",
  },
  {
    id: "command_center",
    label: "Command Center",
    icon: Bell,
    description: "Full visibility. Real‑time price changes, friend activity, trending titles, and daily digests—you'll never miss a thing.",
  },
] as const;

type AlertLevel = (typeof ALERT_LEVELS)[number]["id"];

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

/* ── Toggle Row ── */
const ToggleRow = ({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const SubscriptionHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* ── Alert / Notification state ── */
  const [alertLevel, setAlertLevel] = useState<AlertLevel>("balanced");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [churnAlertsEnabled, setChurnAlertsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
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
      const [profileRes, subsRes, swapsRes] = await Promise.all([
        supabase.from("profiles").select("alert_level, email_enabled, push_enabled, churn_alerts_enabled").eq("user_id", user.id).single() as any,
        supabase.from("active_subscriptions").select("*").order("created_at", { ascending: true }) as any,
        supabase.from("service_swaps").select("id, old_service, new_service, show_title, show_poster_path, monthly_savings, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10) as any,
      ]);

      if (!profileRes.error && profileRes.data) {
        setAlertLevel(profileRes.data.alert_level || "balanced");
        setEmailEnabled(profileRes.data.email_enabled ?? true);
        setPushEnabled(profileRes.data.push_enabled ?? true);
        setChurnAlertsEnabled(profileRes.data.churn_alerts_enabled ?? true);
      }
      if (subsRes.data) setSubs(subsRes.data);
      if (swapsRes.data) setSwaps(swapsRes.data);
      setProfileLoading(false);
    };
    fetchAll();
  }, [user]);

  /* ── DB helpers ── */
  const syncToDb = useCallback(async (patch: Record<string, unknown>) => {
    if (!user) return;
    setSaving(true);
    const { error } = await (supabase.from("profiles").update(patch).eq("user_id", user.id) as any);
    setSaving(false);
    if (error) toast.error("Failed to save preference.");
    else toast.success("Preference saved.");
  }, [user]);

  const handleAlertLevel = (level: AlertLevel) => { setAlertLevel(level); syncToDb({ alert_level: level }); };
  const handleToggle = (key: string, value: boolean, setter: (v: boolean) => void) => { setter(value); syncToDb({ [key]: value }); };

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

  const currentIdx = ALERT_LEVELS.findIndex((l) => l.id === alertLevel);
  const currentLevel = ALERT_LEVELS[currentIdx] || ALERT_LEVELS[1];
  const CurrentIcon = currentLevel.icon;
  const sliderPercent = (currentIdx / (ALERT_LEVELS.length - 1)) * 100;

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

      {/* ── Hero: Total Potential Savings ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-brand opacity-[0.06]" />
          <p className="text-sm font-medium text-muted-foreground mb-2 relative z-10">Total Potential Savings</p>
          <h2
            className="text-5xl md:text-6xl font-black text-gradient relative z-10"
            style={{ textShadow: "0 0 40px hsl(var(--brand-cyan) / 0.4), 0 0 80px hsl(var(--brand-purple) / 0.2)" }}
          >
            ${totalYearlySavings.toFixed(2)}
            <span className="text-2xl text-muted-foreground font-semibold">/yr</span>
          </h2>
          <div className="flex items-center justify-center gap-4 mt-3 relative z-10">
            <span className="text-sm text-muted-foreground">
              Spending <span className="text-foreground font-semibold">${totalMonthly.toFixed(2)}/mo</span>
            </span>
            {totalSwapSavings > 0 && (
              <span className="flex items-center gap-1 text-sm font-semibold text-[hsl(var(--brand-cyan))]">
                <TrendingDown className="h-4 w-4" />
                ${totalSwapSavings.toFixed(2)}/mo saved via swaps
              </span>
            )}
          </div>
        </motion.div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pb-16 space-y-6">
        {/* ── Optimization Progress Bar ── */}
        {healthItems.length > 0 && (() => {
          const totalServices = healthItems.length;
          const redCount = healthItems.filter((h) => h.status === "red").length;
          const optimizedCount = totalServices - redCount;
          const progressPercent = Math.round((optimizedCount / totalServices) * 100);
          const isFullyOptimized = redCount === 0;
          const mostUnderused = [...healthItems]
            .filter((h) => h.status === "red")
            .sort((a, b) => (a.cueCount - b.cueCount) || (b.monthlyCost - a.monthlyCost))[0];

          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-[hsl(var(--brand-cyan))]" />
                  <h3 className="text-sm font-bold text-foreground">
                    {isFullyOptimized ? "Fully Optimized! 🎉" : "Optimization Progress"}
                  </h3>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {optimizedCount}/{totalServices} services healthy
                </span>
              </div>

              <div className="relative">
                <Progress value={progressPercent} className="h-3 bg-muted" />
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                  style={{
                    width: `${progressPercent}%`,
                    background: isFullyOptimized
                      ? "linear-gradient(90deg, hsl(145 70% 45%), hsl(160 80% 50%))"
                      : "linear-gradient(90deg, hsl(var(--brand-cyan)), hsl(var(--brand-purple)))",
                    boxShadow: isFullyOptimized
                      ? "0 0 16px hsl(145 70% 45% / 0.5)"
                      : "0 0 16px hsl(var(--brand-cyan) / 0.4)",
                    height: "100%",
                    borderRadius: "9999px",
                  }}
                />
              </div>

              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-muted-foreground">
                  {isFullyOptimized
                    ? "All your subscriptions are actively used. Nice work!"
                    : `${redCount} service${redCount > 1 ? "s" : ""} with no activity in 30+ days`}
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
            </motion.div>
          );
        })()}
        {/* ── Row 1: Subscription Health + Active Services ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subscription Health */}
          <SubscriptionHealth onHealthData={setHealthItems} />

          {/* Active Services Manager */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-brand">
                  <Tv className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Active Services</h2>
                  <p className="text-xs text-muted-foreground">
                    {subs.length} service{subs.length !== 1 ? "s" : ""} · ${totalMonthly.toFixed(2)}/mo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="h-9 w-9 rounded-lg bg-secondary border border-border hover:border-primary/50 flex items-center justify-center transition-colors"
              >
                <Plus className={`h-4 w-4 text-foreground transition-transform ${showAddForm ? "rotate-45" : ""}`} />
              </button>
            </div>

            <AnimatePresence>
              {showAddForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Service</label>
                      <select value={newService} onChange={(e) => setNewService(e.target.value)} className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="">Select a service…</option>
                        {availableServices.map((s) => (<option key={s.id} value={s.id}>{s.logo} {s.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Monthly Cost ($)</label>
                      <input type="number" min="0" max="999" step="0.01" value={newCost} onChange={(e) => setNewCost(e.target.value)} placeholder="9.99" className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <button onClick={addSubscription} disabled={!newService || !newCost || addingSub} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 glow">
                      {addingSub ? "Adding…" : "Add Subscription"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {subs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No subscriptions yet. Tap + to add your first.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                <AnimatePresence>
                  {subs.map((sub) => {
                    const service = getService(sub.service_name);
                    return (
                      <motion.div key={sub.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10, height: 0 }} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border group">
                        <span className="text-xl flex-shrink-0">{service?.logo || "📺"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{service?.name || sub.service_name}</p>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>{Number(sub.monthly_cost).toFixed(2)}</span>
                        </div>
                        <button onClick={() => removeSubscription(sub.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100" aria-label="Remove subscription">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Row 2: Recently Swapped (Service Swap History) ── */}
        {swaps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-brand">
                  <History className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Service Swap History</h2>
                  <p className="text-xs text-muted-foreground">{swaps.length} swap{swaps.length !== 1 ? "s" : ""} completed</p>
                </div>
              </div>
              {totalSwapSavings > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-[hsl(var(--brand-cyan)_/_0.1)] text-[hsl(var(--brand-cyan))] text-sm font-bold px-3 py-1.5 rounded-full ring-1 ring-[hsl(var(--brand-cyan)_/_0.3)]">
                    <TrendingDown className="h-4 w-4" />
                    ${totalSwapSavings.toFixed(2)}/mo
                  </div>
                  <div className="flex items-center gap-1.5 bg-[hsl(var(--brand-purple)_/_0.15)] text-[hsl(var(--brand-purple))] text-sm font-bold px-3 py-1.5 rounded-full ring-1 ring-[hsl(var(--brand-purple)_/_0.3)]">
                    🎉 ${totalYearlySavings.toFixed(2)}/yr
                  </div>
                </div>
              )}
            </div>

            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-4 pb-4">
                {swaps.map((swap, i) => {
                  const oldInfo = getService(swap.old_service);
                  const newInfo = getService(swap.new_service);
                  return (
                    <motion.div key={swap.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="w-[280px] shrink-0 rounded-xl p-4 bg-secondary/30 ring-1 ring-border hover:ring-[hsl(var(--brand-cyan)_/_0.3)] transition-all">
                      <div className="flex gap-3 mb-3">
                        {swap.show_poster_path && (
                          <img src={getImageUrl(swap.show_poster_path, "w200") || ""} alt={swap.show_title} className="h-16 w-11 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate whitespace-normal leading-tight">{swap.show_title}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(swap.created_at), { addSuffix: true })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
                          {oldInfo?.logo || "📺"} <span className="capitalize">{oldInfo?.name || swap.old_service}</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[hsl(var(--brand-cyan)_/_0.1)] text-[hsl(var(--brand-cyan))] text-xs font-medium">
                          {newInfo?.logo || "📺"} <span className="capitalize">{newInfo?.name || swap.new_service}</span>
                        </div>
                      </div>
                      {swap.monthly_savings > 0 && (
                        <p className="mt-2 text-[11px] text-[hsl(var(--brand-cyan))] font-semibold">💰 Saving ${Number(swap.monthly_savings).toFixed(2)}/mo</p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </motion.div>
        )}

        {/* ── Row 3: Churn Alerts Settings ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alert Level */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-brand">
                <Bell className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Alert Intensity</h2>
                <p className="text-xs text-muted-foreground">How much we bother you.</p>
              </div>
              {saving && <span className="ml-auto text-xs text-muted-foreground animate-pulse">Saving…</span>}
            </div>

            <div className="space-y-4">
              <div
                className="relative h-8 flex items-center cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  const idx = Math.max(0, Math.min(ALERT_LEVELS.length - 1, Math.round(percent * (ALERT_LEVELS.length - 1))));
                  handleAlertLevel(ALERT_LEVELS[idx].id);
                }}
              >
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 rounded-full overflow-hidden bg-muted">
                  <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out" style={{ width: `${sliderPercent + 10}%`, background: `linear-gradient(90deg, hsl(var(--brand-cyan)), hsl(var(--brand-purple)))`, boxShadow: `0 0 16px hsl(var(--brand-cyan) / 0.4), 0 0 40px hsl(var(--brand-purple) / 0.2)` }} />
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border-2 border-foreground bg-background transition-all duration-500 ease-out pointer-events-none" style={{ left: `calc(${sliderPercent}% - 12px + ${currentIdx === 0 ? 12 : currentIdx === 2 ? -12 : 0}px)`, boxShadow: `0 0 12px hsl(var(--brand-cyan) / 0.5), 0 0 30px hsl(var(--brand-purple) / 0.3)` }} />
              </div>
              <div className="flex justify-between">
                {ALERT_LEVELS.map((level) => (
                  <button key={level.id} onClick={() => handleAlertLevel(level.id)} className={`text-xs font-medium transition-colors px-2 py-1 rounded-lg ${alertLevel === level.id ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground"}`}>
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            <motion.div key={alertLevel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
              <CurrentIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground/80 leading-relaxed">{currentLevel.description}</p>
            </motion.div>
          </motion.section>

          {/* Channel Toggles */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-foreground">Notification Channels</h2>
            <ToggleRow icon={Mail} label="Email Notifications" description="Weekly digests and alerts to your inbox." checked={emailEnabled} onChange={(v) => handleToggle("email_enabled", v, setEmailEnabled)} />
            <ToggleRow icon={Smartphone} label="Push Notifications" description="Real‑time pings on your device." checked={pushEnabled} onChange={(v) => handleToggle("push_enabled", v, setPushEnabled)} />
            <ToggleRow icon={AlertTriangle} label="Churn Alerts" description="Heads‑up before titles leave your services." checked={churnAlertsEnabled} onChange={(v) => handleToggle("churn_alerts_enabled", v, setChurnAlertsEnabled)} />
          </motion.section>
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
