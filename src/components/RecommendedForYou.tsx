import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getRecommendations, type TMDBResult } from "@/lib/tmdb";
import MovieCard from "./MovieCard";
import { motion } from "framer-motion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface SourceShow {
  tmdb_id: number;
  title: string;
  media_type: string;
}

const RecommendedForYou = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<TMDBResult[]>([]);
  const [sourceNames, setSourceNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
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
          .select("tmdb_id")
          .eq("user_id", user.id);

        const existingIds = new Set((allCues || []).map((c) => c.tmdb_id));

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

        setRecommendations(merged.slice(0, 20));
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
      ? `Based on your interest in ${sourceNames.slice(0, 2).join(" & ")}${sourceNames.length > 2 ? ` and more` : ""}`
      : "Picks we think you'll love";

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6"
      >
        <h2 className="text-xl font-semibold text-foreground">
          Recommended for You
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </motion.div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-5 pb-4">
          {recommendations.map((item, i) => (
            <div key={item.id} className="w-[160px] sm:w-[180px] shrink-0">
              <MovieCard item={item} index={i} />
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};

export default RecommendedForYou;
