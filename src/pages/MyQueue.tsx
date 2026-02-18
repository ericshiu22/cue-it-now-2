import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Trash2, Film, Tv, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getImageUrl } from "@/lib/tmdb";
import { getService, getDeepLink, SERVICE_LIST } from "@/lib/streaming-services";
import { toast } from "sonner";

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

const ServicePicker = ({
  current,
  onSelect,
}: {
  current: string;
  onSelect: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const service = getService(current);
  const label = service?.name || (current === "unassigned" ? "Assign Service" : current);
  const logo = service?.logo || "📺";

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(!open);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-secondary border border-border hover:border-primary/50 transition-colors"
      >
        <span>{logo}</span>
        <span className="text-foreground truncate max-w-[80px]">{label}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open &&
        ReactDOM.createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
            <div
              style={{ top: menuPos.top, left: menuPos.left }}
              className="fixed z-[9999] rounded-lg py-1 min-w-[160px] shadow-xl border border-border bg-popover"
            >
              {SERVICE_LIST.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelect(s.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors ${
                    s.id === current ? "text-primary" : "text-popover-foreground"
                  }`}
                >
                  <span>{s.logo}</span>
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </div>
  );
};

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

  const updateService = async (id: string, serviceId: string) => {
    const { error } = await supabase
      .from("cues")
      .update({ service_provider: serviceId })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update service.");
      return;
    }

    setCues((prev) =>
      prev.map((c) => (c.id === id ? { ...c, service_provider: serviceId } : c))
    );
    const name = getService(serviceId)?.name || serviceId;
    toast.success(`Moved to ${name}`);
  };

  // Group by service provider
  const grouped = cues.reduce<Record<string, Cue[]>>((acc, cue) => {
    const key = cue.service_provider;
    if (!acc[key]) acc[key] = [];
    acc[key].push(cue);
    return acc;
  }, {});

  // Sort groups: "unassigned" last
  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
    if (a === "unassigned") return 1;
    if (b === "unassigned") return -1;
    return a.localeCompare(b);
  });

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
              {sortedGroups.map(([provider, items]) => {
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
                        {provider === "unassigned" ? "Unassigned" : service?.name || provider}
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
                                <div className="mt-1.5">
                                  <ServicePicker
                                    current={cue.service_provider}
                                    onSelect={(serviceId) => updateService(cue.id, serviceId)}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mt-2">
                                {cue.service_provider !== "unassigned" && (
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity glow"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Watch Now
                                  </a>
                                )}
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
