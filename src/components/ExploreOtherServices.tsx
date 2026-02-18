import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getRecommendations, getWatchProviders, getImageUrl, type TMDBResult, type WatchProvider } from "@/lib/tmdb";
import MovieCard from "./MovieCard";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { X, ArrowRightLeft } from "lucide-react";

interface ExploreItem {
  item: TMDBResult;
  provider: WatchProvider;
  serviceName: string;
}

const mapProviderToServiceId = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("netflix")) return "netflix";
  if (lower.includes("max") && !lower.includes("paramount")) return "max";
  if (lower.includes("disney")) return "disney+";
  if (lower.includes("hulu")) return "hulu";
  if (lower.includes("prime") || lower.includes("amazon")) return "prime video";
  if (lower.includes("apple")) return "apple tv+";
  if (lower.includes("peacock")) return "peacock";
  if (lower.includes("paramount")) return "paramount";
  if (lower.includes("crunchyroll")) return "crunchyroll";
  if (lower.includes("tubi")) return "tubi";
  if (lower.includes("pluto")) return "pluto";
  if (lower.includes("discovery")) return "discovery";
  if (lower.includes("starz")) return "starz";
  if (lower.includes("showtime")) return "showtime";
  if (lower.includes("mubi")) return "mubi";
  return lower;
};

const KNOWN_SERVICES = new Set([
  "netflix", "max", "disney+", "hulu", "prime video", "apple tv+",
  "peacock", "paramount", "crunchyroll", "tubi", "pluto", "discovery",
  "starz", "showtime", "mubi",
]);

const ExploreOtherServices = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [underusedService, setUnderusedService] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ show: ExploreItem; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetch = async () => {
      try {
        const { data: subs } = await supabase
          .from("active_subscriptions")
          .select("service_name")
          .eq("user_id", user.id)
          .eq("is_active", true);

        const userServices = new Set((subs || []).map((s) => s.service_name.toLowerCase()));
        if (userServices.size === 0) { setLoading(false); return; }

        // Find underused service (least cues)
        const { data: allCues } = await supabase
          .from("cues")
          .select("tmdb_id, service_provider")
          .eq("user_id", user.id);

        const serviceCueCount: Record<string, number> = {};
        for (const c of allCues || []) {
          const svc = c.service_provider?.toLowerCase() || "";
          if (userServices.has(svc)) {
            serviceCueCount[svc] = (serviceCueCount[svc] || 0) + 1;
          }
        }
        // Least-used current service
        let leastUsed: string | null = null;
        let leastCount = Infinity;
        for (const svc of userServices) {
          const count = serviceCueCount[svc] || 0;
          if (count < leastCount) { leastCount = count; leastUsed = svc; }
        }
        setUnderusedService(leastUsed);

        const existingIds = new Set((allCues || []).map((c) => c.tmdb_id));

        // Get 3 most recent cues for recs
        const { data: recentCues } = await supabase
          .from("cues")
          .select("tmdb_id, title, media_type")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (!recentCues || recentCues.length === 0) { setLoading(false); return; }

        const allRecs = await Promise.all(
          recentCues.map((s) =>
            getRecommendations(s.media_type as "movie" | "tv", s.tmdb_id)
          )
        );

        const seen = new Set<number>();
        const merged: TMDBResult[] = [];
        for (const recs of allRecs) {
          for (const r of recs) {
            if (!seen.has(r.id) && !existingIds.has(r.id) && r.poster_path) {
              seen.add(r.id);
              merged.push(r);
            }
          }
        }

        // Filter to shows NOT on user's services but on a known service
        const providerResults = await Promise.all(
          merged.slice(0, 40).map(async (item) => {
            const providers = await getWatchProviders(item.media_type, item.id);
            if (!providers) return null;
            const flatrate = [...(providers.flatrate || []), ...(providers.ads || [])];
            for (const p of flatrate) {
              const serviceId = mapProviderToServiceId(p.provider_name);
              if (!userServices.has(serviceId) && KNOWN_SERVICES.has(serviceId)) {
                return { item, provider: p, serviceName: serviceId } as ExploreItem;
              }
            }
            return null;
          })
        );

        setItems((providerResults.filter(Boolean) as ExploreItem[]).slice(0, 15));
      } catch (err) {
        console.error("Failed to fetch explore items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user]);

  const handleSwitchWatch = (e: React.MouseEvent, rec: ExploreItem) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopup({ show: rec, x: rect.left, y: rect.top });
  };

  if (loading || !user || items.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-accent-foreground" />
          Explore Other Services
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Great picks you'd unlock with a different subscription
        </p>
      </motion.div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-5 pb-4">
          {items.map((rec, i) => (
            <div key={rec.item.id} className="w-[160px] sm:w-[180px] shrink-0">
              <div className="relative rounded-xl ring-1 ring-[hsl(var(--glow)_/_0.3)] shadow-[0_0_12px_hsl(var(--glow)_/_0.15)]">
                <MovieCard item={rec.item} index={i} />
              </div>
              {/* Service badge */}
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="h-4 w-4 rounded overflow-hidden shrink-0">
                  <img
                    src={getImageUrl(rec.provider.logo_path, "w200") || ""}
                    alt={rec.provider.provider_name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground truncate whitespace-normal leading-tight">
                  Available on {rec.provider.provider_name}
                </span>
              </div>
              {/* Switch & Watch button */}
              <button
                onClick={(e) => handleSwitchWatch(e, rec)}
                className="mt-2 w-full py-1.5 rounded-lg text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/80 transition-colors ring-1 ring-[hsl(var(--glow)_/_0.2)]"
              >
                🔄 Switch & Watch
              </button>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Switch & Watch Popup */}
      <AnimatePresence>
        {popup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setPopup(null)}
          >
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="relative glass-strong rounded-2xl p-6 max-w-sm w-full shadow-xl ring-1 ring-[hsl(var(--glow)_/_0.3)]"
            >
              <button
                onClick={() => setPopup(null)}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={getImageUrl(popup.show.provider.logo_path, "w200") || ""}
                    alt={popup.show.provider.provider_name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-foreground text-base">
                  {popup.show.item.title || popup.show.item.name}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This show is on <span className="font-semibold text-foreground">{popup.show.provider.provider_name}</span>.
                {underusedService && (
                  <> You could swap <span className="font-semibold text-foreground capitalize">{underusedService}</span> to save money this month.</>
                )}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ExploreOtherServices;
