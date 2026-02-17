import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Search, Check, X, Clock, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  profile: Profile;
}

const Friends = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingIncoming, setPendingIncoming] = useState<Friendship[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<Friendship[]>([]);
  const [acceptedFriends, setAcceptedFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriendships = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("friendships")
      .select("id, user_id, friend_id, status")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Collect all related user IDs
    const otherIds = data.map((f) => (f.user_id === user.id ? f.friend_id : f.user_id));
    
    let profilesMap: Record<string, Profile> = {};
    if (otherIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", otherIds);
      if (profiles) {
        profiles.forEach((p) => { profilesMap[p.user_id] = p; });
      }
    }

    const incoming: Friendship[] = [];
    const outgoing: Friendship[] = [];
    const accepted: Friendship[] = [];

    data.forEach((f) => {
      const otherId = f.user_id === user.id ? f.friend_id : f.user_id;
      const friendship: Friendship = {
        ...f,
        profile: profilesMap[otherId] || { user_id: otherId, username: null, avatar_url: null },
      };

      if (f.status === "accepted") {
        accepted.push(friendship);
      } else if (f.status === "pending") {
        if (f.friend_id === user.id) {
          incoming.push(friendship);
        } else {
          outgoing.push(friendship);
        }
      }
    });

    setPendingIncoming(incoming);
    setPendingOutgoing(outgoing);
    setAcceptedFriends(accepted);
    setLoading(false);
  };

  useEffect(() => { fetchFriendships(); }, [user]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;
    setSearching(true);

    const { data } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url")
      .ilike("username", `%${searchQuery.trim()}%`)
      .neq("user_id", user.id)
      .limit(10);

    setSearchResults(data || []);
    setSearching(false);
  };

  const sendRequest = async (friendId: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({
      user_id: user.id,
      friend_id: friendId,
      status: "pending",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request sent!" });
      setSearchResults((prev) => prev.filter((p) => p.user_id !== friendId));
      fetchFriendships();
    }
  };

  const respondToRequest = async (friendshipId: string, accept: boolean) => {
    if (accept) {
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
      toast({ title: "Friend added!" });
    } else {
      await supabase.from("friendships").delete().eq("id", friendshipId);
      toast({ title: "Request declined" });
    }
    fetchFriendships();
  };

  const removeFriend = async (friendshipId: string) => {
    await supabase.from("friendships").delete().eq("id", friendshipId);
    toast({ title: "Friend removed" });
    fetchFriendships();
  };

  // Filter out users already in any friendship
  const allFriendUserIds = new Set([
    ...pendingIncoming.map((f) => f.profile.user_id),
    ...pendingOutgoing.map((f) => f.profile.user_id),
    ...acceptedFriends.map((f) => f.profile.user_id),
  ]);
  const filteredResults = searchResults.filter((p) => !allFriendUserIds.has(p.user_id));

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Users className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Sign in to manage friends</h2>
          <p className="text-muted-foreground mb-6">Connect with friends and compare queues.</p>
          <Link to="/auth" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 transition-opacity glow">
            Sign In
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          <span className="text-gradient">Friends</span>
        </h1>

        {/* Search */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-muted-foreground mb-2">Find friends by username</label>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search username…"
                className="w-full pl-10 pr-4 py-2.5 glass rounded-xl text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim() || searching}
              className="px-5 py-2.5 rounded-xl bg-gradient-brand text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {searching ? "…" : "Search"}
            </button>
          </form>

          {/* Search Results */}
          <AnimatePresence>
            {filteredResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-3 glass rounded-xl overflow-hidden divide-y divide-border/30"
              >
                {filteredResults.map((profile) => (
                  <div key={profile.user_id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {(profile.username || "?")[0].toUpperCase()}
                      </div>
                      <span className="text-foreground font-medium text-sm">{profile.username || "Unknown"}</span>
                    </div>
                    <button
                      onClick={() => sendRequest(profile.user_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Add
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {searchResults.length > 0 && filteredResults.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">All results are already in your friends list.</p>
          )}
          {searchResults.length === 0 && searchQuery && !searching && (
            <p className="mt-3 text-sm text-muted-foreground">No users found.</p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Pending Incoming */}
            {pendingIncoming.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Requests ({pendingIncoming.length})
                </h2>
                <div className="space-y-2">
                  {pendingIncoming.map((f) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass rounded-xl px-4 py-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-sm font-bold">
                          {(f.profile.username || "?")[0].toUpperCase()}
                        </div>
                        <span className="text-foreground font-medium text-sm">{f.profile.username || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => respondToRequest(f.id, true)}
                          className="p-2 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
                          title="Accept"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => respondToRequest(f.id, false)}
                          className="p-2 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors"
                          title="Decline"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Pending Outgoing */}
            {pendingOutgoing.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Sent Requests ({pendingOutgoing.length})
                </h2>
                <div className="space-y-2">
                  {pendingOutgoing.map((f) => (
                    <div key={f.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-bold">
                          {(f.profile.username || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="text-foreground font-medium text-sm">{f.profile.username || "Unknown"}</span>
                          <span className="block text-xs text-muted-foreground">Pending…</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Accepted Friends */}
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Friends ({acceptedFriends.length})
              </h2>
              {acceptedFriends.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-muted-foreground text-sm">No friends yet. Search for usernames above to add friends!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {acceptedFriends.map((f) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="glass rounded-xl px-4 py-3 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-sm font-bold">
                          {(f.profile.username || "?")[0].toUpperCase()}
                        </div>
                        <span className="text-foreground font-medium text-sm">{f.profile.username || "Unknown"}</span>
                      </div>
                      <button
                        onClick={() => removeFriend(f.id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove friend"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Friends;
