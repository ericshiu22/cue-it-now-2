import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle, XCircle, X, ExternalLink, DollarSign, Trash2 } from "lucide-react";
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

export type { ServiceHealth, HealthStatus };

interface SubInfo {
  id: string;
  service_name: string;
  monthly_cost: number;
  is_active: boolean;
}

interface SubscriptionHealthProps {
  onHealthData?: (data: ServiceHealth[]) => void;
  embedded?: boolean;
  subs?: SubInfo[];
  onRemove?: (id: string) => void;
}

const SubscriptionHealth = ({ onHealthData, embedded, subs: externalSubs, onRemove }: SubscriptionHealthProps = {}) => {
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

  // Expose health data to parent
  useEffect(() => {
    if (healthData && onHealthData) onHealthData(healthData);
  }, [healthData, onHealthData]);

  if (!user || isLoading) return null;
  if (!healthData || healthData.length === 0) return null;

  // Sort: red first, then yellow, then green
  const sorted = [...healthData].sort((a, b) => {
    const order: Record<HealthStatus, number> = { red: 0, yellow: 1, green: 2 };
    return order[a.status] - order[b.status];
  });

  // In embedded mode, render just the service rows (no wrapper card)
  const serviceRows = (
    <AnimatePresence>
      {sorted.map((service, i) => {
        const config = STATUS_CONFIG[service.status];
        const displayService = getService(service.serviceId);
        const matchingSub = externalSubs?.find(
          (s) => s.service_name.toLowerCase() === service.serviceId.toLowerCase()
        );

        return (
          <motion.div
            key={service.serviceId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
              service.status === "red"
                ? "cursor-pointer hover:bg-destructive/5"
                : "cursor-default hover:bg-secondary/40"
            }`}
            onClick={() => service.status === "red" && setSelectedService(service)}
          >
            {/* Service icon + health dot */}
            <div className="relative flex-shrink-0">
              <span className="text-lg">{displayService?.logo || "📺"}</span>
              <span
                className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background"
                style={{ backgroundColor: config.color }}
              />
            </div>

            {/* Name */}
            <span className="flex-1 text-sm font-medium text-foreground truncate">
              {displayService?.name || service.serviceName}
            </span>

            {/* Activity hint */}
            <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:inline">
              {service.cueCount} cued · {service.daysSinceActivity !== null ? `${service.daysSinceActivity}d` : "—"}
            </span>

            {/* Cost */}
            {embedded && matchingSub && (
              <span className="text-xs font-semibold text-muted-foreground tabular-nums shrink-0">
                ${Number(matchingSub.monthly_cost).toFixed(2)}
              </span>
            )}

            {/* Cancel for red */}
            {service.status === "red" && displayService?.cancelUrl && (
              <a
                href={displayService.cancelUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors shrink-0"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                Cancel
              </a>
            )}

            {/* Delete (embedded mode) */}
            {embedded && matchingSub && onRemove && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(matchingSub.id); }}
                className="p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                aria-label="Remove subscription"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        );
      })}
    </AnimatePresence>
  );

  if (embedded) {
    return (
      <>
        <div className="space-y-0.5">{serviceRows}</div>
        {/* Churn Report Modal */}
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
                <div className="sticky top-0 z-10 flex justify-end p-3">
                  <button onClick={() => setSelectedService(null)} className="h-8 w-8 rounded-full bg-muted/80 backdrop-blur flex items-center justify-center hover:bg-muted transition-colors">
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
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 h-full"
      >
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
        <div className="space-y-3">{serviceRows}</div>
      </motion.div>

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
              <div className="sticky top-0 z-10 flex justify-end p-3">
                <button onClick={() => setSelectedService(null)} className="h-8 w-8 rounded-full bg-muted/80 backdrop-blur flex items-center justify-center hover:bg-muted transition-colors">
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
