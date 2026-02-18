import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle, XCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getService } from "@/lib/streaming-services";
import { useAuth } from "@/contexts/AuthContext";
import MinimalistChurnEmail from "@/components/emails/MinimalistChurnEmail";

type HealthStatus = "green" | "yellow" | "red";

interface ServiceHealth {
  serviceName: string;
  serviceId: string;
  status: HealthStatus;
  cueCount: number;
  monthlyCost: number;
  daysSinceActivity: number | null; // null = never
}

const STATUS_CONFIG: Record<HealthStatus, { label: string; color: string; bgClass: string; icon: typeof CheckCircle }> = {
  green: {
    label: "Healthy",
    color: "hsl(145, 70%, 45%)",
    bgClass: "bg-emerald-500/15 border-emerald-500/30",
    icon: CheckCircle,
  },
  yellow: {
    label: "Idle 14d+",
    color: "hsl(45, 90%, 55%)",
    bgClass: "bg-yellow-500/15 border-yellow-500/30",
    icon: AlertTriangle,
  },
  red: {
    label: "No Activity 30d+",
    color: "hsl(0, 72%, 51%)",
    bgClass: "bg-red-500/15 border-red-500/30",
    icon: XCircle,
  },
};

function computeHealth(
  serviceId: string,
  serviceName: string,
  monthlyCost: number,
  cues: { service_provider: string; created_at: string; status: string }[]
): ServiceHealth {
  const now = Date.now();
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  const serviceCues = cues.filter(
    (c) => c.service_provider.toLowerCase() === serviceId.toLowerCase()
  );

  if (serviceCues.length === 0) {
    return { serviceName, serviceId, status: "red", cueCount: 0, monthlyCost, daysSinceActivity: null };
  }

  const latestDate = Math.max(...serviceCues.map((c) => new Date(c.created_at).getTime()));
  const daysSince = Math.floor((now - latestDate) / (24 * 60 * 60 * 1000));

  let status: HealthStatus = "green";
  if (now - latestDate >= thirtyDays) status = "red";
  else if (now - latestDate >= fourteenDays) status = "yellow";

  return { serviceName, serviceId, status, cueCount: serviceCues.length, monthlyCost, daysSinceActivity: daysSince };
}

const SubscriptionHealth = () => {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState<ServiceHealth | null>(null);

  const { data: healthData, isLoading } = useQuery({
    queryKey: ["subscription-health", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch active subscriptions
      const { data: subs } = await supabase
        .from("active_subscriptions")
        .select("*")
        .eq("is_active", true);

      if (!subs || subs.length === 0) return [];

      // Fetch all cues for this user
      const { data: cues } = await supabase
        .from("cues")
        .select("service_provider, created_at, status");

      return subs.map((sub: any) =>
        computeHealth(sub.service_name, sub.service_name, Number(sub.monthly_cost), cues ?? [])
      );
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  if (!user || isLoading) return null;
  if (!healthData || healthData.length === 0) return null;

  // Sort: red first, then yellow, then green
  const sorted = [...healthData].sort((a, b) => {
    const order: Record<HealthStatus, number> = { red: 0, yellow: 1, green: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 h-full"
      >
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Subscription Health</h2>
              <p className="text-xs text-muted-foreground">
                {sorted.filter((s) => s.status === "red").length} service{sorted.filter((s) => s.status === "red").length !== 1 ? "s" : ""} need attention
              </p>
            </div>
          </div>

          {/* Service list */}
          <div className="space-y-3">
            {sorted.map((service, i) => {
              const config = STATUS_CONFIG[service.status];
              const Icon = config.icon;
              const displayService = getService(service.serviceId);

              return (
                <motion.button
                  key={service.serviceId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => service.status === "red" && setSelectedService(service)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    service.status === "red"
                      ? "cursor-pointer hover:border-red-500/60 hover:bg-red-500/10"
                      : "cursor-default"
                  } ${config.bgClass}`}
                >
                  {/* Service logo */}
                  <span className="text-xl flex-shrink-0">
                    {displayService?.logo || "📺"}
                  </span>

                  {/* Info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">
                      {displayService?.name || service.serviceName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {service.cueCount} cued · {service.daysSinceActivity !== null ? `${service.daysSinceActivity}d ago` : "never"}
                    </div>
                  </div>

                  {/* Health bar */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: service.status === "green" ? "100%" : service.status === "yellow" ? "50%" : "15%",
                          backgroundColor: config.color,
                          boxShadow: `0 0 8px ${config.color}`,
                        }}
                      />
                    </div>
                    <Icon
                      className="h-4 w-4 flex-shrink-0"
                      style={{ color: config.color }}
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>
      </motion.div>

      {/* Minimalist Report Modal */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedService(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="w-full max-w-[580px] max-h-[85vh] overflow-y-auto rounded-2xl border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <div className="sticky top-0 z-10 flex justify-end p-3">
                <button
                  onClick={() => setSelectedService(null)}
                  className="h-8 w-8 rounded-full bg-muted/80 backdrop-blur flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-foreground" />
                </button>
              </div>

              <MinimalistChurnEmail
                serviceName={getService(selectedService.serviceId)?.name || selectedService.serviceName}
                monthlyCost={`$${selectedService.monthlyCost.toFixed(2)}`}
                showsWatched={0}
                showsCued={selectedService.cueCount}
                pauseUrl="#"
                addShowUrl="/queue"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SubscriptionHealth;
