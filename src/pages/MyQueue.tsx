import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Trash2, Film, Tv, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getImageUrl } from "@/lib/tmdb";
import { getService, getDeepLink } from "@/lib/streaming-services";

interface Cue {
  id: string;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  media_type: string;
  service_provider: string;
  deep_link: string | null;
  vote_average: number | null;
  release_year: string | null;
  overview: string | null;
}

const MyQueue = () => {
  const [cues, setCues] = useState<Cue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCues = async () => {
      const { data, error } = await supabase
        .from("cues")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setCues(data as Cue[]);
      setLoading(false);
    };
    fetchCues();
  }, []);

  const removeCue = async (id: string) => {
    await supabase.from("cues").delete().eq("id", id);
    setCues((prev) => prev.filter((c) => c.id !== id));
  };

  // Group by service provider
  const grouped = cues.reduce<Record<string, Cue[]>>((acc, cue) => {
    const key = cue.service_provider;
    if (!acc[key]) acc[key] = [];
    acc[key].push(cue);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          My <span className="text-gradient">Queue</span>
        </h1>
        <span className="text-sm text-muted-foreground">{cues.length} titles</span>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cues.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <Film className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Your queue is empty</h2>
            <p className="text-muted-foreground mb-6">Search for movies & shows and hit "Cue It" to add them here.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity glow"
            >
              Discover Content
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-10">
            <AnimatePresence>
              {Object.entries(grouped).map(([provider, items]) => {
                const service = getService(provider);
                return (
                  <motion.section
                    key={provider}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Service header */}
                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-2xl">{service?.logo || "📺"}</span>
                      <h2 className="text-lg font-bold text-foreground">
                        {service?.name || provider}
                      </h2>
                      <span className="text-xs text-muted-foreground glass px-2 py-0.5 rounded-full">
                        {items.length}
                      </span>
                    </div>

                    {/* Cards grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((cue, i) => {
                        const poster = getImageUrl(cue.poster_path, "w300");
                        const link = getDeepLink(cue.service_provider, cue.title, cue.deep_link);

                        return (
                          <motion.div
                            key={cue.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="glass rounded-xl overflow-hidden flex group"
                          >
                            {/* Poster */}
                            <div className="w-24 h-36 flex-shrink-0">
                              {poster ? (
                                <img src={poster} alt={cue.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-secondary flex items-center justify-center">
                                  {cue.media_type === "tv" ? (
                                    <Tv className="h-6 w-6 text-muted-foreground" />
                                  ) : (
                                    <Film className="h-6 w-6 text-muted-foreground" />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                              <div>
                                <h3 className="font-semibold text-foreground text-sm truncate">{cue.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <span className="uppercase">{cue.media_type}</span>
                                  {cue.release_year && <span>· {cue.release_year}</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mt-2">
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity glow"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Watch Now
                                </a>
                                <button
                                  onClick={() => removeCue(cue.id)}
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                  aria-label="Remove from queue"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.section>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyQueue;
