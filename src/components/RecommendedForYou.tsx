import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getRecommendations, getWatchProviders, getImageUrl, type TMDBResult, type WatchProvider } from "@/lib/tmdb";
import MovieCard from "./MovieCard";
import SectionHeader from "./SectionHeader";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface SourceShow {
  tmdb_id: number;
  title: string;
  media_type: string;
}

interface RecommendedItem {
  item: TMDBResult;
  matchedService: string; // service id that matched user's subscription
  matchedProvider: WatchProvider | null;
}

// Map TMDB provider names to our service IDs (same as MovieCard)
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

const RecommendedForYou = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [sourceNames, setSourceNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        // Get user's active subscriptions
        const { data: subs } = await supabase
          .from("active_subscriptions")
          .select("service_name")
          .eq("user_id", user.id)
          .eq("is_active", true);

        const userServices = new Set((subs || []).map((s) => s.service_name.toLowerCase()));

        if (userServices.size === 0) {
          setLoading(false);
          return;
        }

        // Get 3 most recent cues
        const { data: recentCues } = await supabase
          .from("cues")
          .select("tmdb_id, title, media_type")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (!recentCues || recentCues.length === 0) {
          setLoading(false);
          return;
        }

        const sources: SourceShow[] = recentCues;
        setSourceNames(sources.map((s) => s.title));

        // Get all user cue tmdb_ids for filtering
        const { data: allCues } = await supabase
          .from("cues")
          .select("tmdb_id, service_provider")
          .eq("user_id", user.id);

        const existingIds = new Set((allCues || []).map((c) => c.tmdb_id));

        // Count cues per service for smart sorting
        const serviceCueCount: Record<string, number> = {};
        for (const c of allCues || []) {
          const svc = c.service_provider?.toLowerCase() || "";
          serviceCueCount[svc] = (serviceCueCount[svc] || 0) + 1;
        }

        // Fetch recommendations for each source in parallel
        const allRecs = await Promise.all(
          sources.map((s) =>
            getRecommendations(s.media_type as "movie" | "tv", s.tmdb_id)
          )
        );

        // Merge, deduplicate, filter out existing cues
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

        // Fetch watch providers for each rec and filter by user's subscriptions
        const providerResults = await Promise.all(
          merged.slice(0, 40).map(async (item) => {
            const providers = await getWatchProviders(item.media_type, item.id);
            if (!providers) return null;

            const flatrate = [...(providers.flatrate || []), ...(providers.ads || [])];
            for (const p of flatrate) {
              const serviceId = mapProviderToServiceId(p.provider_name);
              if (userServices.has(serviceId)) {
                return { item, matchedService: serviceId, matchedProvider: p } as RecommendedItem;
              }
            }
            return null;
          })
        );

        const filtered = providerResults.filter(Boolean) as RecommendedItem[];

        // Smart sort: shows on services the user cues from most appear first
        filtered.sort((a, b) => {
          const countA = serviceCueCount[a.matchedService] || 0;
          const countB = serviceCueCount[b.matchedService] || 0;
          return countB - countA;
        });

        setRecommendations(filtered.slice(0, 20));
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  if (loading || !user || recommendations.length === 0) return null;

  const subtitle =
    sourceNames.length > 0
      ? `Based on your active subscriptions and your interest in ${sourceNames.slice(0, 2).join(" & ")}${sourceNames.length > 2 ? ` and more` : ""}`
      : "Picks based on your active subscriptions";

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8">
      <SectionHeader title="Recommended for You" subtitle={subtitle} />

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-5 pb-4">
          {recommendations.map((rec, i) => (
            <div key={rec.item.id} className="w-[160px] sm:w-[180px] shrink-0">
              <div className="relative">
                <MovieCard item={rec.item} index={i} hideProviderBadges />
                {rec.matchedProvider && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-md overflow-hidden shrink-0 shadow-sm">
                      <img
                        src={getImageUrl(rec.matchedProvider.logo_path, "w200") || ""}
                        alt={rec.matchedProvider.provider_name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate leading-tight">
                      {rec.matchedProvider.provider_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};

export default RecommendedForYou;
