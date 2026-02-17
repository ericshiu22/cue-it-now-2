import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Film, Tv, ExternalLink, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getImageUrl } from "@/lib/tmdb";
import { getService, getDeepLink } from "@/lib/streaming-services";
import { Link } from "react-router-dom";

interface Friend {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
}

interface SharedCue {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  media_type: string;
  release_year: string | null;
  vote_average: number | null;
  overview: string | null;
  my_service: string;
  my_deep_link: string | null;
  friend_service: string;
  friend_deep_link: string | null;
}

const LinkUp = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [sharedCues, setSharedCues] = useState<SharedCue[]>([]);
  const [loading, setLoading] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch accepted friends
  useEffect(() => {
    if (!user) return;

    const fetchFriends = async () => {
      // Get friendships where I'm user_id or friend_id and status is accepted
      const { data, error } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .eq("status", "accepted")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (error || !data) {
        setFriendsLoading(false);
        return;
      }

      // Extract the other user's ID from each friendship
      const friendIds = data.map((f) =>
        f.user_id === user.id ? f.friend_id : f.user_id
      );

      if (friendIds.length === 0) {
        setFriendsLoading(false);
        return;
      }

      // Fetch profiles for those friends
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", friendIds);

      if (profiles) setFriends(profiles);
      setFriendsLoading(false);
    };

    fetchFriends();
  }, [user]);

  // Compare cues when a friend is selected
  useEffect(() => {
    if (!user || !selectedFriend) {
      setSharedCues([]);
      return;
    }

    const compareQueues = async () => {
      setLoading(true);

      // Fetch my cues
      const { data: myCues } = await supabase
        .from("cues")
        .select("*")
        .eq("user_id", user.id);

      // Fetch friend's cues — RLS won't allow this directly.
      // We need an RPC or policy. Let's use a workaround:
      // We'll create an edge function or use a DB function.
      // For now, since RLS restricts to own cues, we need a DB function.
      
      // Actually, let's query via a DB function we'll create.
      // But wait — we can use a simpler approach: create a DB function
      // that returns shared tmdb_ids between two users.

      const { data: friendCues } = await supabase.rpc("get_shared_cues" as any, {
        _user_id: user.id,
        _friend_id: selectedFriend.user_id,
      });

      if (myCues && friendCues) {
        const shared: SharedCue[] = (friendCues as any[]).map((fc: any) => {
          const mine = myCues.find((m) => m.tmdb_id === fc.tmdb_id);
          return {
            tmdb_id: fc.tmdb_id,
            title: mine?.title || fc.title,
            poster_path: mine?.poster_path || fc.poster_path,
            media_type: mine?.media_type || fc.media_type,
            release_year: mine?.release_year || fc.release_year,
            vote_average: mine?.vote_average || fc.vote_average,
            overview: mine?.overview || fc.overview,
            my_service: mine?.service_provider || "unassigned",
            my_deep_link: mine?.deep_link || null,
            friend_service: fc.service_provider,
            friend_deep_link: fc.deep_link,
          };
        });
        setSharedCues(shared);
      }

      setLoading(false);
    };

    compareQueues();
  }, [user, selectedFriend]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Users className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Sign in to Link Up</h2>
          <p className="text-muted-foreground mb-6">Connect with friends and find shows to watch together.</p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 transition-opacity glow"
          >
            Sign In
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          The <span className="text-gradient">Link Up</span>
        </h1>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Friend Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Select a friend to compare queues
          </label>

          {friendsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading friends…
            </div>
          ) : friends.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No friends yet. Add friends to start comparing queues!</p>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full sm:w-80 flex items-center justify-between gap-3 px-4 py-3 glass rounded-xl hover:border-primary/50 transition-colors"
              >
                {selectedFriend ? (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {(selectedFriend.username || "?")[0].toUpperCase()}
                    </div>
                    <span className="text-foreground font-medium">
                      {selectedFriend.username || "Unknown User"}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Choose a friend…</span>
                )}
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute z-50 mt-2 w-full sm:w-80 glass-strong rounded-xl overflow-hidden"
                    >
                      {friends.map((friend) => (
                        <button
                          key={friend.user_id}
                          onClick={() => {
                            setSelectedFriend(friend);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors ${
                            selectedFriend?.user_id === friend.user_id
                              ? "bg-primary/10 text-primary"
                              : "text-foreground"
                          }`}
                        >
                          <div className="h-8 w-8 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-sm font-bold">
                            {(friend.username || "?")[0].toUpperCase()}
                          </div>
                          <span className="font-medium">
                            {friend.username || "Unknown User"}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Shared Queue */}
        {selectedFriend && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-lg font-bold text-foreground">
                Shared <span className="text-gradient">Queue</span>
              </h2>
              {!loading && (
                <span className="text-xs text-muted-foreground glass px-2 py-0.5 rounded-full">
                  {sharedCues.length} titles in common
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sharedCues.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-12 text-center"
              >
                <Film className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="text-foreground font-semibold mb-1">No overlapping titles</h3>
                <p className="text-muted-foreground text-sm">
                  You and {selectedFriend.username || "your friend"} don't have any shows in common yet. Keep adding to your queues!
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {sharedCues.map((cue, i) => {
                    const poster = getImageUrl(cue.poster_path, "w300");
                    const myLink = getDeepLink(cue.my_service, cue.title, cue.my_deep_link);
                    const myService = getService(cue.my_service);

                    return (
                      <motion.div
                        key={cue.tmdb_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
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
                              {cue.vote_average && (
                                <span>· ⭐ {Number(cue.vote_average).toFixed(1)}</span>
                              )}
                            </div>
                            {myService && (
                              <div className="mt-1.5 text-xs text-muted-foreground">
                                <span>{myService.logo} {myService.name}</span>
                              </div>
                            )}
                          </div>

                          <a
                            href={myLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gradient-brand text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity glow"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Watch Together
                          </a>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default LinkUp;
