import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { User, Bell, Mail, Smartphone, AlertTriangle, Shield, Zap, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/* ── Alert Levels ── */
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

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [savedUsername, setSavedUsername] = useState("");
  const [loading, setLoading] = useState(true);

  /* ── Notification state ── */
  const [alertLevel, setAlertLevel] = useState<AlertLevel>("balanced");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [churnAlertsEnabled, setChurnAlertsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await (supabase
        .from("profiles")
        .select("username, alert_level, email_enabled, push_enabled, churn_alerts_enabled")
        .eq("user_id", user.id)
        .single() as any);
      if (data) {
        setUsername(data.username || "");
        setSavedUsername(data.username || "");
        setAlertLevel(data.alert_level || "balanced");
        setEmailEnabled(data.email_enabled ?? true);
        setPushEnabled(data.push_enabled ?? true);
        setChurnAlertsEnabled(data.churn_alerts_enabled ?? true);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

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

  const handleSaveUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 3 || trimmed.length > 30) {
      toast.error("Username must be 3–30 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      toast.error("Username can only contain letters, numbers, and underscores.");
      return;
    }
    await syncToDb({ username: trimmed });
    setUsername(trimmed);
    setSavedUsername(trimmed);
  };

  if (!user) { navigate("/auth"); return null; }

  const currentIdx = ALERT_LEVELS.findIndex((l) => l.id === alertLevel);
  const currentLevel = ALERT_LEVELS[currentIdx] || ALERT_LEVELS[1];
  const CurrentIcon = currentLevel.icon;
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
            {/* Account info */}
            <section className="glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-brand">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Account</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              {savedUsername ? (
                <p className="text-sm text-muted-foreground">Username: <span className="text-foreground font-medium">@{savedUsername}</span></p>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      maxLength={30}
                      className="max-w-xs"
                    />
                    <Button size="sm" onClick={handleSaveUsername} disabled={saving}>
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Letters, numbers, and underscores only. Friends can find you by username or email.</p>
                </>
              )}
            </section>

            {/* Link to Subscription Hub */}
            <section className="glass rounded-2xl p-6">
              <Link
                to="/subscriptions"
                className="flex items-center justify-between group"
              >
                <div>
                  <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">Subscription Hub</h2>
                  <p className="text-sm text-muted-foreground">Manage services, alerts, and view savings.</p>
                </div>
                <span className="text-primary text-sm font-semibold">Go →</span>
              </Link>
            </section>

            {/* Alert Intensity */}
            <section className="glass rounded-2xl p-6 space-y-6">
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
            </section>

            {/* Notification Channels */}
            <section className="glass rounded-2xl p-6 space-y-5">
              <h2 className="text-base font-bold text-foreground">Notification Channels</h2>
              <ToggleRow icon={Mail} label="Email Notifications" description="Weekly digests and alerts to your inbox." checked={emailEnabled} onChange={(v) => handleToggle("email_enabled", v, setEmailEnabled)} />
              <ToggleRow icon={Smartphone} label="Push Notifications" description="Real‑time pings on your device." checked={pushEnabled} onChange={(v) => handleToggle("push_enabled", v, setPushEnabled)} />
              <ToggleRow icon={AlertTriangle} label="Churn Alerts" description="Heads‑up before titles leave your services." checked={churnAlertsEnabled} onChange={(v) => handleToggle("churn_alerts_enabled", v, setChurnAlertsEnabled)} />
            </section>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Profile;