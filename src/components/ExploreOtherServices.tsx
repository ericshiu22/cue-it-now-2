import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getRecommendations, getWatchProviders, getImageUrl, type TMDBResult, type WatchProvider } from "@/lib/tmdb";
import MovieCard from "./MovieCard";
import ServiceSwapModal from "./ServiceSwapModal";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ArrowRightLeft } from "lucide-react";
import SectionHeader from "./SectionHeader";

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
  const [selectedItem, setSelectedItem] = useState<ExploreItem | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchData = async () => {
      try {
        const { data: subs } = await supabase
          .from("active_subscriptions")
          .select("service_name")
          .eq("user_id", user.id)
          .eq("is_active", true);

        const userServices = new Set((subs || []).map((s) => s.service_name.toLowerCase()));
        if (userServices.size === 0) { setLoading(false); return; }

        const { data: allCues } = await supabase
          .from("cues")
          .select("tmdb_id, service_provider")
          .eq("user_id", user.id);

        const existingIds = new Set((allCues || []).map((c) => c.tmdb_id));

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

    fetchData();
  }, [user]);

  const handleSwitchWatch = (e: React.MouseEvent, rec: ExploreItem) => {
    e.stopPropagation();
    setSelectedItem(rec);
  };

  if (loading || !user || items.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8">
      <SectionHeader
        title="Explore Other Services"
        subtitle="Great picks you'd unlock with a different subscription"
        icon={<ArrowRightLeft className="h-5 w-5 text-accent-foreground" />}
      />

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-5 pb-4">
          {items.map((rec, i) => (
            <div key={rec.item.id} className="w-[160px] sm:w-[180px] shrink-0">
              <div className="relative rounded-xl ring-1 ring-[hsl(var(--glow)_/_0.3)] shadow-[0_0_12px_hsl(var(--glow)_/_0.15)]">
                <MovieCard item={rec.item} index={i} />
              </div>
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

      {selectedItem && (
        <ServiceSwapModal
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          show={selectedItem.item}
          targetProvider={selectedItem.provider}
          targetServiceId={selectedItem.serviceName}
        />
      )}
    </section>
  );
};

export default ExploreOtherServices;
