import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Bell, Zap, Shield, Mail, Smartphone, AlertTriangle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";

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

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [alertLevel, setAlertLevel] = useState<AlertLevel>("balanced");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [churnAlertsEnabled, setChurnAlertsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
