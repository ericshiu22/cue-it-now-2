import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getService } from "@/lib/streaming-services";
import { getImageUrl } from "@/lib/tmdb";
import { motion } from "framer-motion";
import { ArrowRight, History, TrendingDown } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface SwapRecord {
  id: string;
  old_service: string;
  new_service: string;
  show_title: string;
  show_poster_path: string | null;
  monthly_savings: number;
  created_at: string;
}

const RecentlySwapped = () => {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState<SwapRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("service_swaps")
        .select("id, old_service, new_service, show_title, show_poster_path, monthly_savings, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setSwaps((data as SwapRecord[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading || !user || swaps.length === 0) return null;

  const totalSavings = swaps.reduce((sum, s) => sum + Number(s.monthly_savings), 0);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-accent-foreground" />
              Recently Swapped
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your service swap history
            </p>
          </div>
          {totalSavings > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-[hsl(var(--brand-cyan)_/_0.1)] text-[hsl(var(--brand-cyan))] text-sm font-bold px-3 py-1.5 rounded-full ring-1 ring-[hsl(var(--brand-cyan)_/_0.3)]">
                <TrendingDown className="h-4 w-4" />
                ${totalSavings.toFixed(2)}/mo
              </div>
              <div className="flex items-center gap-1.5 bg-[hsl(var(--brand-purple)_/_0.15)] text-[hsl(var(--brand-purple))] text-sm font-bold px-3 py-1.5 rounded-full ring-1 ring-[hsl(var(--brand-purple)_/_0.3)]">
                🎉 ${(totalSavings * 12).toFixed(2)}/yr projected
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {swaps.map((swap, i) => {
            const oldInfo = getService(swap.old_service);
            const newInfo = getService(swap.new_service);

            return (
              <motion.div
                key={swap.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="w-[280px] shrink-0 rounded-xl p-4 bg-secondary/30 ring-1 ring-border hover:ring-[hsl(var(--brand-cyan)_/_0.3)] transition-all"
              >
                {/* Show info */}
                <div className="flex gap-3 mb-3">
                  {swap.show_poster_path && (
                    <img
                      src={getImageUrl(swap.show_poster_path, "w200") || ""}
                      alt={swap.show_title}
                      className="h-16 w-11 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate whitespace-normal leading-tight">
                      {swap.show_title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(swap.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Swap arrow */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
                    {oldInfo?.logo || "📺"}
                    <span className="capitalize">{oldInfo?.name || swap.old_service}</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[hsl(var(--brand-cyan)_/_0.1)] text-[hsl(var(--brand-cyan))] text-xs font-medium">
                    {newInfo?.logo || "📺"}
                    <span className="capitalize">{newInfo?.name || swap.new_service}</span>
                  </div>
                </div>

                {/* Savings */}
                {swap.monthly_savings > 0 && (
                  <p className="mt-2 text-[11px] text-[hsl(var(--brand-cyan))] font-semibold">
                    💰 Saving ${Number(swap.monthly_savings).toFixed(2)}/mo
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};

export default RecentlySwapped;
