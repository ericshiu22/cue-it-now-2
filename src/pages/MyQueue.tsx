import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Trash2, Film, Tv, ChevronDown, ShoppingCart, RefreshCw, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getImageUrl } from "@/lib/tmdb";
import { getService, getDeepLink, SERVICE_LIST } from "@/lib/streaming-services";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  provider_status?: string;
  previous_service_provider?: string | null;
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
  const isUnknownService = !service && current !== "unassigned";
  const label = service?.name || (current === "unassigned" ? "Assign Service" : current.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
  const logo = service?.logo || (isUnknownService ? "📺" : "📺");

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

const BUY_RENT_OPTIONS = [
  {
    id: "prime video",
    name: "Amazon Prime Video",
    logo: "🟦",
    searchUrl: (title: string) => `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=instant-video`,
  },
  {
    id: "apple tv+",
    name: "Apple TV+",
    logo: "⚪",
    searchUrl: (title: string) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`,
  },
];

const BuyRentPicker = ({ title }: { title: string }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

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
        <ShoppingCart className="h-3 w-3 text-muted-foreground" />
        <span className="text-foreground">Buy or Rent</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open &&
        ReactDOM.createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
            <div
              style={{ top: menuPos.top, left: menuPos.left }}
              className="fixed z-[9999] rounded-lg py-1 min-w-[180px] shadow-xl border border-border bg-popover"
            >
              {BUY_RENT_OPTIONS.map((opt) => (
                <a
                  key={opt.id}
                  href={opt.searchUrl(title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-popover-foreground hover:bg-accent transition-colors"
                >
                  <span>{opt.logo}</span>
                  <span className="flex-1">{opt.name}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              ))}
            </div>
          </>,
          document.body
        )}
    </div>
  );
};

const ProviderStatusBadge = ({ cue }: { cue: Cue }) => {
  if (!cue.provider_status || cue.provider_status === "active") return null;

  const prevService = cue.previous_service_provider
    ? getService(cue.previous_service_provider)?.name || cue.previous_service_provider
    : null;
  const currentService = getService(cue.service_provider)?.name || cue.service_provider;

  if (cue.provider_status === "moved") {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 text-[10px] border-amber-500/50 text-amber-400 bg-amber-500/10">
              <ArrowRightLeft className="h-3 w-3" />
              Moved
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px]">
            <p className="text-xs">
              Moved from {prevService} → {currentService}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (cue.provider_status === "leaving") {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 text-[10px] border-destructive/50 text-destructive bg-destructive/10">
              <AlertTriangle className="h-3 w-3" />
              Leaving
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px]">
            <p className="text-xs">
              No longer streaming on {prevService || currentService}. May only be available to buy or rent.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
};

const CueCard = ({
  cue,
  index,
  onRemove,
  onUpdateService,
  isBuyRent = false,
}: {
  cue: Cue;
  index: number;
  onRemove: (id: string) => void;
  onUpdateService: (id: string, serviceId: string) => void;
  isBuyRent?: boolean;
}) => {
  const poster = getImageUrl(cue.poster_path, "w300");
  const link = getDeepLink(cue.service_provider, cue.title, cue.deep_link);

  return (
    <motion.div
      key={cue.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="glass rounded-xl overflow-hidden flex group"
    >
      <div className="w-24 h-36 flex-shrink-0 relative">
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
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-semibold text-foreground text-sm truncate">{cue.title}</h3>
            <ProviderStatusBadge cue={cue} />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span className="uppercase">{cue.media_type}</span>
            {cue.release_year && <span>· {cue.release_year}</span>}
          </div>
          {isBuyRent ? (
            <div className="mt-1.5">
              <BuyRentPicker title={cue.title} />
            </div>
          ) : (
            (() => {
              const service = getService(cue.service_provider);
              const displayName = service?.name || cue.service_provider.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              return (
                <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{service?.logo || "📺"}</span>
                  <span>{displayName}</span>
                </div>
              );
            })()
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          {!isBuyRent && cue.service_provider !== "unassigned" && (
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
            onClick={() => onRemove(cue.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Remove from queue"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const MyQueue = () => {
  const [cues, setCues] = useState<Cue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeServices, setActiveServices] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    const [cuesRes, subsRes] = await Promise.all([
      supabase.from("cues").select("*").order("created_at", { ascending: false }),
      supabase.from("active_subscriptions").select("service_name").eq("is_active", true),
    ]);

    if (!cuesRes.error && cuesRes.data) setCues(cuesRes.data as Cue[]);
    if (!subsRes.error && subsRes.data) {
      setActiveServices(new Set(subsRes.data.map((s) => s.service_name.toLowerCase())));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // On-demand provider refresh
  const refreshProviders = async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.functions.invoke("check-providers", {
        body: { user_id: user.id },
      });

      if (error) throw error;

      // Re-fetch cues to show updated statuses
      await fetchData();

      const updated = cues.filter(
        (c) => c.provider_status === "moved" || c.provider_status === "leaving"
      );
      if (updated.length > 0) {
        toast.info(`${updated.length} title${updated.length > 1 ? "s" : ""} had provider changes.`);
      } else {
        toast.success("All titles confirmed on their current services.");
      }
    } catch (err: any) {
      console.error("Provider refresh failed:", err);
      toast.error("Couldn't refresh providers. Try again later.");
    } finally {
      setRefreshing(false);
    }
  };

  const removeCue = async (id: string) => {
    await supabase.from("cues").delete().eq("id", id);
    setCues((prev) => prev.filter((c) => c.id !== id));
  };

  const updateService = async (id: string, serviceId: string) => {
    const { error } = await supabase
      .from("cues")
      .update({ service_provider: serviceId, provider_status: "active", previous_service_provider: null })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update service.");
      return;
    }

    setCues((prev) =>
      prev.map((c) => (c.id === id ? { ...c, service_provider: serviceId, provider_status: "active", previous_service_provider: null } : c))
    );
    const name = getService(serviceId)?.name || serviceId;
    toast.success(`Moved to ${name}`);
  };

  // Split cues into active-service, no-active-service, and buy/rent
  const activeCues: Cue[] = [];
  const inactiveCues: Cue[] = [];
  const buyRentCues: Cue[] = [];

  cues.forEach((cue) => {
    const provider = cue.service_provider.toLowerCase();
    if (provider === "unassigned") {
      buyRentCues.push(cue);
    } else if (!activeServices.has(provider)) {
      inactiveCues.push(cue);
    } else {
      activeCues.push(cue);
    }
  });

  // Group cues by service provider
  const groupByProvider = (list: Cue[]) =>
    list.reduce<Record<string, Cue[]>>((acc, cue) => {
      const key = cue.service_provider;
      if (!acc[key]) acc[key] = [];
      acc[key].push(cue);
      return acc;
    }, {});

  const activeGrouped = Object.entries(groupByProvider(activeCues)).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const inactiveGrouped = Object.entries(groupByProvider(inactiveCues)).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const changedCount = cues.filter(
    (c) => c.provider_status === "moved" || c.provider_status === "leaving"
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          My <span className="text-gradient">Queue</span>
        </h1>
        <div className="flex items-center gap-3">
          {changedCount > 0 && (
            <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-400 bg-amber-500/10">
              <AlertTriangle className="h-3 w-3" />
              {changedCount} changed
            </Badge>
          )}
          <button
            onClick={refreshProviders}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary border border-border hover:border-primary/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Checking…" : "Check Services"}
          </button>
          <span className="text-sm text-muted-foreground">{cues.length} titles</span>
        </div>
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
              {/* Active service groups — highlighted container */}
              {activeGrouped.length > 0 && (
                <motion.div
                  key="active-wrapper"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-6 space-y-8"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-primary">
                      Active Subscriptions
                    </h2>
                  </div>

                  {activeGrouped.map(([provider, items]) => {
                    const service = getService(provider);
                    const displayName = service?.name || provider.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    return (
                      <section key={provider}>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-2xl">{service?.logo || "📺"}</span>
                          <h3 className="text-lg font-bold text-foreground">
                            {displayName}
                          </h3>
                          <span className="text-xs text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full font-medium">
                            {items.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {items.map((cue, i) => (
                            <CueCard key={cue.id} cue={cue} index={i} onRemove={removeCue} onUpdateService={updateService} />
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </motion.div>
              )}

              {/* No Active Service section — dimmed */}
              {inactiveCues.length > 0 && (
                <motion.section
                  key="no-active-service"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-border/50 bg-secondary/30 p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">🚫</span>
                    <h2 className="text-lg font-bold text-foreground/70">No Active Service</h2>
                    <span className="text-xs text-muted-foreground glass px-2 py-0.5 rounded-full">
                      {inactiveCues.length}
                    </span>
                  </div>

                  <div className="space-y-8">
                    {inactiveGrouped.map(([provider, items]) => {
                      const service = getService(provider);
                      const displayName = service?.name || provider.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                      return (
                        <div key={provider}>
                          <div className="flex items-center gap-2 mb-3 ml-1">
                            <span className="text-lg">{service?.logo || "📺"}</span>
                            <h3 className="text-sm font-semibold text-muted-foreground">
                              {displayName}
                            </h3>
                            <span className="text-xs text-muted-foreground/70 glass px-1.5 py-0.5 rounded-full">
                              {items.length}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((cue, i) => (
                              <CueCard key={cue.id} cue={cue} index={i} onRemove={removeCue} onUpdateService={updateService} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.section>
              )}

              {/* Buy or Rent section — dimmed */}
              {buyRentCues.length > 0 && (
                <motion.section
                  key="buy-or-rent"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-border/50 bg-secondary/30 p-6"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-2xl">🛒</span>
                    <h2 className="text-lg font-bold text-foreground/70">Buy or Rent</h2>
                    <span className="text-xs text-muted-foreground glass px-2 py-0.5 rounded-full">
                      {buyRentCues.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {buyRentCues.map((cue, i) => (
                      <CueCard key={cue.id} cue={cue} index={i} onRemove={removeCue} onUpdateService={updateService} isBuyRent />
                    ))}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyQueue;
