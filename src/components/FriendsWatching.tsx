import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import MovieCard from "./MovieCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Users } from "lucide-react";
import type { TMDBResult, WatchProvider } from "@/lib/tmdb";
import { getWatchProviders, getImageUrl } from "@/lib/tmdb";
import { mapProviderToServiceId, getService } from "@/lib/streaming-services";
import SectionHeader from "./SectionHeader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FriendCue {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  media_type: string;
  release_year: string | null;
  vote_average: number | null;
  overview: string | null;
  service_provider: string;
  deep_link: string | null;
  friend_username: string | null;
}

interface EnrichedCue {
  cue: FriendCue;
  provider: WatchProvider | null;
  friends: string[];
}

const FriendsWatching = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<EnrichedCue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data, error } = await supabase.rpc("get_friends_cues", {
          _user_id: user.id,
        });

        if (error) {
          console.error("Failed to fetch friends cues:", error);
          return;
        }

        const cues = (data as FriendCue[]) || [];

        // Fetch TMDB watch providers to get real logos
        // Group cues by tmdb_id to combine friends watching the same thing
        const grouped = new Map<number, { cue: FriendCue; friends: string[] }>();
        for (const cue of cues) {
          const existing = grouped.get(cue.tmdb_id);
          if (existing) {
            if (cue.friend_username && !existing.friends.includes(cue.friend_username)) {
              existing.friends.push(cue.friend_username);
            }
          } else {
            grouped.set(cue.tmdb_id, {
              cue,
              friends: cue.friend_username ? [cue.friend_username] : [],
            });
          }
        }

        const uniqueCues = [...grouped.values()];

        // Fetch TMDB watch providers to get real logos
        const enriched = await Promise.all(
          uniqueCues.map(async ({ cue, friends }) => {
            try {
              const providers = await getWatchProviders(
                cue.media_type as "movie" | "tv",
                cue.tmdb_id
              );
              if (providers) {
                const allProviders = [
                  ...(providers.flatrate || []),
                  ...(providers.ads || []),
                  ...(providers.free || []),
                  ...(providers.buy || []),
                  ...(providers.rent || []),
                ];
                const serviceId = cue.service_provider.toLowerCase();
                const matched = allProviders.find(
                  (p) => mapProviderToServiceId(p.provider_name) === serviceId
                );
                return { cue, provider: matched || null, friends };
              }
            } catch {
              // ignore per-item errors
            }
            return { cue, provider: null, friends };
          })
        );

        setItems(enriched);
      } catch (err) {
        console.error("Failed to fetch friends cues:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading || !user || items.length === 0) return null;

  const friendNames = [
    ...new Set(items.flatMap((i) => i.friends).filter(Boolean)),
  ];
  const subtitle =
    friendNames.length > 0
      ? `From ${friendNames.slice(0, 3).join(", ")}${friendNames.length > 3 ? ` and ${friendNames.length - 3} more` : ""}'s watchlists`
      : "Shows and movies your friends are watching";

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8">
      <SectionHeader
        title="Friends Are Watching"
        subtitle={subtitle}
        icon={<Users className="h-5 w-5 text-primary" />}
      />

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-5 pb-4">
          {items.map(({ cue, provider, friends }, i) => {
            const asResult: TMDBResult = {
              id: cue.tmdb_id,
              title: cue.title,
              name: cue.title,
              poster_path: cue.poster_path,
              backdrop_path: null,
              media_type: cue.media_type as "movie" | "tv",
              overview: cue.overview || "",
              vote_average: cue.vote_average || 0,
              release_date: cue.release_year || "",
              first_air_date: cue.release_year || "",
              genre_ids: [],
            };

            const friendLabel =
              friends.length === 0
                ? null
                : friends.length === 1
                ? friends[0]
                : friends.length === 2
                ? `${friends[0]} & ${friends[1]}`
                : `${friends[0]}, ${friends[1]} +${friends.length - 2}`;

            return (
              <div key={cue.tmdb_id} className="w-[160px] sm:w-[180px] shrink-0">
                <div className="relative">
                  <MovieCard item={asResult} index={i} hideProviderBadges />
                  {provider ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-md overflow-hidden shrink-0 shadow-sm">
                        <img
                          src={getImageUrl(provider.logo_path, "w200") || ""}
                          alt={provider.provider_name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate leading-tight">
                        {provider.provider_name}
                      </span>
                    </div>
                  ) : (() => {
                    const svc = getService(cue.service_provider);
                    return svc ? (
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-sm shrink-0" title={svc.name}>{svc.logo}</span>
                        <span className="text-[10px] text-muted-foreground truncate leading-tight">
                          {svc.name}
                        </span>
                      </div>
                    ) : null;
                  })()}
                  {friendLabel && (
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="mt-1 flex items-center gap-1.5 cursor-default">
                            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-[10px] text-muted-foreground truncate leading-tight">
                              {friendLabel}
                            </span>
                          </div>
                        </TooltipTrigger>
                        {friends.length > 2 && (
                          <TooltipContent side="bottom" className="max-w-[200px]">
                            <p className="text-xs">{friends.join(", ")}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};

export default FriendsWatching;
