import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Zap, Shield, Mail, Smartphone, AlertTriangle, Plus, Trash2, DollarSign, Tv } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { SERVICE_LIST, getService } from "@/lib/streaming-services";

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

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [alertLevel, setAlertLevel] = useState<AlertLevel>("balanced");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [churnAlertsEnabled, setChurnAlertsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Subscriptions state
  const [subs, setSubs] = useState<ActiveSub[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState("");
  const [newCost, setNewCost] = useState("");
  const [addingSub, setAddingSub] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data, error } = await (supabase
        .from("profiles")
        .select("alert_level, email_enabled, push_enabled, churn_alerts_enabled")
        .eq("user_id", user.id)
        .single() as any);

      if (!error && data) {
        setAlertLevel(data.alert_level || "balanced");
        setEmailEnabled(data.email_enabled ?? true);
        setPushEnabled(data.push_enabled ?? true);
        setChurnAlertsEnabled(data.churn_alerts_enabled ?? true);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  // Fetch subscriptions
  useEffect(() => {
    if (!user) return;
    const fetchSubs = async () => {
      const { data } = await supabase
        .from("active_subscriptions")
        .select("*")
        .order("created_at", { ascending: true }) as any;
      if (data) setSubs(data);
    };
    fetchSubs();
  }, [user]);

  const addSubscription = async () => {
    if (!user || !newService) return;
    const cost = parseFloat(newCost);
    if (isNaN(cost) || cost < 0 || cost > 999) {
      toast.error("Enter a valid monthly cost (0–999).");
      return;
    }
    setAddingSub(true);
    const { data, error } = await supabase
      .from("active_subscriptions")
      .insert({ user_id: user.id, service_name: newService, monthly_cost: cost, is_active: true })
      .select()
      .single() as any;
    setAddingSub(false);
    if (error) {
      if (error.code === "23505") toast.error("You already have this service.");
      else toast.error("Failed to add subscription.");
      return;
    }
    setSubs((prev) => [...prev, data]);
    setNewService("");
    setNewCost("");
    setShowAddForm(false);
    toast.success("Subscription added.");
  };

  const removeSubscription = async (id: string) => {
    const { error } = await supabase.from("active_subscriptions").delete().eq("id", id) as any;
    if (error) {
      toast.error("Failed to remove subscription.");
      return;
    }
    setSubs((prev) => prev.filter((s) => s.id !== id));
    toast.success("Subscription removed.");
  };

  // Existing services the user hasn't added yet
  const availableServices = SERVICE_LIST.filter(
    (s) => !subs.some((sub) => sub.service_name.toLowerCase() === s.id.toLowerCase())
  );

  // Auto‑save helper
  const syncToDb = useCallback(
    async (patch: Record<string, unknown>) => {
      if (!user) return;
      setSaving(true);
      const { error } = await (supabase
        .from("profiles")
        .update(patch)
        .eq("user_id", user.id) as any);

      setSaving(false);
      if (error) {
        toast.error("Failed to save preference.");
      } else {
        toast.success("Preference saved.");
      }
    },
    [user]
  );

  const handleAlertLevel = (level: AlertLevel) => {
    setAlertLevel(level);
    syncToDb({ alert_level: level });
  };

  const handleToggle = (
    key: "email_enabled" | "push_enabled" | "churn_alerts_enabled",
    value: boolean,
    setter: (v: boolean) => void
  ) => {
    setter(value);
    syncToDb({ [key]: value });
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  const currentIdx = ALERT_LEVELS.findIndex((l) => l.id === alertLevel);
  const currentLevel = ALERT_LEVELS[currentIdx] || ALERT_LEVELS[1];
  const CurrentIcon = currentLevel.icon;

  // Slider percentage for gradient glow
  const sliderPercent = (currentIdx / (ALERT_LEVELS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-foreground">
          <span className="text-gradient">Profile</span> Settings
        </h1>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* ── Notification Intensity ── */}
            <section className="glass rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-brand">
                  <Bell className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Notification Intensity</h2>
                  <p className="text-sm text-muted-foreground">Choose how much we bother you.</p>
                </div>
                {saving && (
                  <span className="ml-auto text-xs text-muted-foreground animate-pulse">Saving…</span>
                )}
              </div>

              {/* Glowing slider track */}
              <div className="space-y-4">
                <div
                  className="relative h-8 flex items-center cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percent = x / rect.width;
                    const idx = Math.round(percent * (ALERT_LEVELS.length - 1));
                    const clamped = Math.max(0, Math.min(ALERT_LEVELS.length - 1, idx));
                    handleAlertLevel(ALERT_LEVELS[clamped].id);
                  }}
                >
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 rounded-full overflow-hidden bg-muted">
                    {/* Filled track with cyan→purple gradient */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${sliderPercent + 10}%`,
                        background: `linear-gradient(90deg, hsl(var(--brand-cyan)), hsl(var(--brand-purple)))`,
                        boxShadow: `0 0 16px hsl(var(--brand-cyan) / 0.4), 0 0 40px hsl(var(--brand-purple) / 0.2)`,
                      }}
                    />
                  </div>
                  {/* Thumb */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border-2 border-foreground bg-background transition-all duration-500 ease-out pointer-events-none"
                    style={{
                      left: `calc(${sliderPercent}% - 12px + ${currentIdx === 0 ? 12 : currentIdx === 2 ? -12 : 0}px)`,
                      boxShadow: `0 0 12px hsl(var(--brand-cyan) / 0.5), 0 0 30px hsl(var(--brand-purple) / 0.3)`,
                    }}
                  />
                </div>

                {/* Labels row */}
                <div className="flex justify-between">
                  {ALERT_LEVELS.map((level) => {
                    const active = alertLevel === level.id;
                    return (
                      <button
                        key={level.id}
                        onClick={() => handleAlertLevel(level.id)}
                        className={`text-xs font-medium transition-colors px-2 py-1 rounded-lg ${
                          active
                            ? "text-foreground bg-secondary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {level.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contextual description */}
              <motion.div
                key={alertLevel}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border"
              >
                <CurrentIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground/80 leading-relaxed">{currentLevel.description}</p>
              </motion.div>
            </section>

            {/* ── Channel Toggles ── */}
            <section className="glass rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground">Channels</h2>

              <ToggleRow
                icon={Mail}
                label="Email Notifications"
                description="Weekly digests and alerts to your inbox."
                checked={emailEnabled}
                onChange={(v) => handleToggle("email_enabled", v, setEmailEnabled)}
              />
              <ToggleRow
                icon={Smartphone}
                label="Push Notifications"
                description="Real‑time pings on your device."
                checked={pushEnabled}
                onChange={(v) => handleToggle("push_enabled", v, setPushEnabled)}
              />
              <ToggleRow
                icon={AlertTriangle}
                label="Churn Alerts"
                description="Heads‑up before titles leave your services."
                checked={churnAlertsEnabled}
                onChange={(v) => handleToggle("churn_alerts_enabled", v, setChurnAlertsEnabled)}
              />
            </section>

            {/* ── Subscription Management ── */}
            <section className="glass rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-brand">
                    <Tv className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">My Subscriptions</h2>
                    <p className="text-sm text-muted-foreground">
                      {subs.length} service{subs.length !== 1 ? "s" : ""} · ${subs.reduce((sum, s) => sum + Number(s.monthly_cost), 0).toFixed(2)}/mo
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

              {/* Add form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Service</label>
                        <select
                          value={newService}
                          onChange={(e) => setNewService(e.target.value)}
                          className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">Select a service…</option>
                          {availableServices.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.logo} {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Monthly Cost ($)</label>
                        <input
                          type="number"
                          min="0"
                          max="999"
                          step="0.01"
                          value={newCost}
                          onChange={(e) => setNewCost(e.target.value)}
                          placeholder="9.99"
                          className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <button
                        onClick={addSubscription}
                        disabled={!newService || !newCost || addingSub}
                        className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 glow"
                      >
                        {addingSub ? "Adding…" : "Add Subscription"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Subscription list */}
              {subs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No subscriptions yet. Tap + to add your first.
                </p>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {subs.map((sub) => {
                      const service = getService(sub.service_name);
                      return (
                        <motion.div
                          key={sub.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10, height: 0 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border group"
                        >
                          <span className="text-xl flex-shrink-0">{service?.logo || "📺"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {service?.name || sub.service_name}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>{Number(sub.monthly_cost).toFixed(2)}</span>
                          </div>
                          <button
                            onClick={() => removeSubscription(sub.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                            aria-label="Remove subscription"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </section>
          </motion.div>
        )}
      </main>
    </div>
  );
};

/* ── Reusable toggle row ── */
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

export default Profile;
