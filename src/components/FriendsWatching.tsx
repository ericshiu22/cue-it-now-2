import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import MovieCard from "./MovieCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Users } from "lucide-react";
import type { TMDBResult } from "@/lib/tmdb";
import SectionHeader from "./SectionHeader";
import { getService } from "@/lib/streaming-services";

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

const FriendsWatching = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<FriendCue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        const { data, error } = await supabase.rpc("get_friends_cues", {
          _user_id: user.id,
        });

        if (error) {
          console.error("Failed to fetch friends cues:", error);
          return;
        }

        setItems((data as FriendCue[]) || []);
      } catch (err) {
        console.error("Failed to fetch friends cues:", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user]);

  if (loading || !user || items.length === 0) return null;

  // Collect unique friend names for subtitle
  const friendNames = [...new Set(items.map((i) => i.friend_username).filter(Boolean))];
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
          {items.map((cue, i) => {
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

            return (
              <div key={cue.tmdb_id} className="w-[160px] sm:w-[180px] shrink-0">
                <div className="relative">
                  <MovieCard item={asResult} index={i} hideProviderBadges />
                  {(() => {
                    const svc = getService(cue.service_provider);
                    return svc ? (
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-md overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                          <span className="text-sm">{svc.logo}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate leading-tight">
                          {svc.name}
                        </span>
                      </div>
                    ) : null;
                  })()}
                  {cue.friend_username && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[10px] text-muted-foreground truncate leading-tight">
                        {cue.friend_username}
                      </span>
                    </div>
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
