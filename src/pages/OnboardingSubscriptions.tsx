import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight, Tv } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_LIST } from "@/lib/streaming-services";
import { toast } from "sonner";

const OnboardingSubscriptions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);

    const inserts = Array.from(selected).map((serviceId) => {
      const svc = SERVICE_LIST.find((s) => s.id === serviceId);
      return {
        user_id: user.id,
        service_name: svc?.name ?? serviceId,
        monthly_cost: 0,
        is_active: true,
      };
    });

    if (inserts.length > 0) {
      const { error } = await supabase.from("active_subscriptions").insert(inserts);
      if (error) {
        toast.error("Couldn't save subscriptions. You can add them later in the Sub Hub.");
      }
    }

    localStorage.setItem("cue-subs-onboarded", "true");
    setSaving(false);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="absolute inset-0 z-0 circuit-pattern pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col items-center px-4 py-10 max-w-lg mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-brand flex items-center justify-center mx-auto mb-4 glow">
            <Tv className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            What do you subscribe to?
          </h1>
          <p className="text-sm text-muted-foreground">
            Select your active streaming services so we can personalize your experience.
          </p>
        </motion.div>

        {/* Service grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full mb-8"
        >
          {SERVICE_LIST.map((svc) => {
            const isSelected = selected.has(svc.id);
            return (
              <button
                key={svc.id}
                onClick={() => toggle(svc.id)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/10 glow"
                    : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-brand flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </motion.div>
                )}
                <span className="text-2xl">{svc.logo}</span>
                <span className="text-xs font-medium text-foreground text-center leading-tight">
                  {svc.name}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* CTA */}
        <div className="w-full space-y-3 mt-auto">
          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-gradient-brand text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 glow hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving..." : selected.size > 0 ? `Continue with ${selected.size} service${selected.size > 1 ? "s" : ""}` : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              localStorage.setItem("cue-subs-onboarded", "true");
              navigate("/", { replace: true });
            }}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Skip for now — I'll add them later
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSubscriptions;
