import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Search, Check, X, Clock, UserMinus, Film, Tv, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getImageUrl } from "@/lib/tmdb";
import { getService, getDeepLink } from "@/lib/streaming-services";
import FriendGroups from "@/components/FriendGroups";
import AuthGateTooltip from "@/components/AuthGateTooltip";

interface Profile {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
}

const displayName = (p: Profile) => p.username || p.email || "Unknown";
const displayInitial = (p: Profile) => (p.username || p.email || "?")[0].toUpperCase();

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  profile: Profile;
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

const Friends = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Friends state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingIncoming, setPendingIncoming] = useState<Friendship[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<Friendship[]>([]);
  const [acceptedFriends, setAcceptedFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  // LinkUp state
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null);
  const [sharedCues, setSharedCues] = useState<SharedCue[]>([]);
  const [linkUpLoading, setLinkUpLoading] = useState(false);
  const [linkUpFilter, setLinkUpFilter] = useState<"all" | "common" | "unique">("all");

  // Group filter state
  const [friendsGroupFilter, setFriendsGroupFilter] = useState<string | null>(null);
  const [linkUpGroupFilter, setLinkUpGroupFilter] = useState<string | null>(null);
  const [groupMembersMap, setGroupMembersMap] = useState<Record<string, string[]>>({});

  // --- Friends logic ---
  const fetchFriendships = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const { data, error } = await supabase
      .from("friendships")
      .select("id, user_id, friend_id, status")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error || !data) { setLoading(false); return; }

    const otherIds = data.map((f) => (f.user_id === user.id ? f.friend_id : f.user_id));
    let profilesMap: Record<string, Profile> = {};
    if (otherIds.length > 0) {
      const { data: profiles } = await supabase.rpc("get_users_public_data" as any, {
        _user_ids: otherIds,
      });
      if (profiles) (profiles as any[]).forEach((p: any) => { profilesMap[p.user_id] = p as Profile; });
    }

    const incoming: Friendship[] = [];
    const outgoing: Friendship[] = [];
    const accepted: Friendship[] = [];

    data.forEach((f) => {
      const otherId = f.user_id === user.id ? f.friend_id : f.user_id;
      const friendship: Friendship = {
        ...f,
        profile: profilesMap[otherId] || { user_id: otherId, username: null, avatar_url: null, email: null },
      };
      if (f.status === "accepted") accepted.push(friendship);
      else if (f.status === "pending") {
        if (f.friend_id === user.id) incoming.push(friendship);
        else outgoing.push(friendship);
      }
    });

    setPendingIncoming(incoming);
    setPendingOutgoing(outgoing);
    setAcceptedFriends(accepted);
    setLoading(false);
  };

  useEffect(() => { fetchFriendships(); }, [user]);

  // Fetch group members when a group filter is selected
  const handleGroupFilterChange = async (groupId: string | null, target: "friends" | "linkup") => {
    if (target === "friends") setFriendsGroupFilter(groupId);
    else setLinkUpGroupFilter(groupId);

    if (groupId && !groupMembersMap[groupId]) {
      const { data } = await supabase
        .from("friend_group_members")
        .select("friend_user_id")
        .eq("group_id", groupId);
      if (data) {
        setGroupMembersMap((prev) => ({ ...prev, [groupId]: data.map((m) => m.friend_user_id) }));
      }
    }
  };

  const getFilteredFriends = (groupId: string | null) => {
    if (!groupId) return acceptedFriends;
    const members = groupMembersMap[groupId] || [];
    return acceptedFriends.filter((f) => members.includes(f.profile.user_id));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;
    setSearching(true);
    const { data } = await supabase.rpc("search_users", {
      _query: searchQuery.trim(),
      _current_user_id: user.id,
    });
    setSearchResults((data as Profile[]) || []);
    setSearching(false);
  };

  const sendRequest = async (friendId: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({ user_id: user.id, friend_id: friendId, status: "pending" });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Request sent!" }); setSearchResults((prev) => prev.filter((p) => p.user_id !== friendId)); fetchFriendships(); }
  };

  const respondToRequest = async (friendshipId: string, accept: boolean) => {
    if (accept) { await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId); toast({ title: "Friend added!" }); }
    else { await supabase.from("friendships").delete().eq("id", friendshipId); toast({ title: "Request declined" }); }
    fetchFriendships();
  };

  const removeFriend = async (friendshipId: string) => {
    await supabase.from("friendships").delete().eq("id", friendshipId);
    toast({ title: "Friend removed" });
    fetchFriendships();
  };

  const allFriendUserIds = new Set([
    ...pendingIncoming.map((f) => f.profile.user_id),
    ...pendingOutgoing.map((f) => f.profile.user_id),
    ...acceptedFriends.map((f) => f.profile.user_id),
  ]);
  const filteredResults = searchResults.filter((p) => !allFriendUserIds.has(p.user_id));

  // --- LinkUp logic ---
  useEffect(() => {
    if (!user || !selectedFriend) { setSharedCues([]); return; }

    const fetchFriendQueue = async () => {
      setLinkUpLoading(true);
      const [{ data: friendCues }, { data: sharedData }] = await Promise.all([
        supabase.rpc("get_friend_all_cues" as any, { _user_id: user.id, _friend_id: selectedFriend.user_id }),
        supabase.rpc("get_shared_cues" as any, { _user_id: user.id, _friend_id: selectedFriend.user_id }),
      ]);

      if (friendCues) {
        const sharedTmdbIds = new Set(
          (sharedData as any[] || []).map((s: any) => Number(s.tmdb_id))
        );
        const allFriendCues: SharedCue[] = (friendCues as any[]).map((fc: any) => {
          const isShared = sharedTmdbIds.has(Number(fc.tmdb_id));
          return {
            tmdb_id: fc.tmdb_id, title: fc.title, poster_path: fc.poster_path,
            media_type: fc.media_type, release_year: fc.release_year,
            vote_average: fc.vote_average, overview: fc.overview,
            my_service: isShared ? "shared" : "", my_deep_link: null,
            friend_service: fc.service_provider, friend_deep_link: fc.deep_link,
          };
        });
        setSharedCues(allFriendCues);
      }
      setLinkUpLoading(false);
    };
    fetchFriendQueue();
  }, [user, selectedFriend]);


  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          <span className="text-gradient">Friends</span>
        </h1>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="w-full sm:w-auto mb-6 bg-secondary/50">
            <TabsTrigger value="friends" className="gap-1.5">
              <Users className="h-4 w-4" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="linkup" className="gap-1.5">
              <Film className="h-4 w-4" />
              The Link Up
            </TabsTrigger>
          </TabsList>

          {/* ===== FRIENDS TAB ===== */}
          <TabsContent value="friends">
            {/* Search */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Find friends by username or email</label>
              <AuthGateTooltip>
                <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by username or email…"
                      className="w-full pl-10 pr-4 py-2.5 glass rounded-xl text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                    />
                  </div>
                  <button type="submit" disabled={!searchQuery.trim() || searching}
                    className="px-5 py-2.5 rounded-xl bg-gradient-brand text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40">
                    {searching ? "…" : "Search"}
                  </button>
                </form>
              </AuthGateTooltip>

              <AnimatePresence>
                {filteredResults.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="mt-3 glass rounded-xl overflow-hidden divide-y divide-border/30">
                    {filteredResults.map((profile) => (
                      <div key={profile.user_id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-sm font-bold">
                            {displayInitial(profile as Profile)}
                          </div>
                          <span className="text-foreground font-medium text-sm">{displayName(profile as Profile)}</span>
                        </div>
                        <button onClick={() => sendRequest(profile.user_id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors">
                          <UserPlus className="h-3.5 w-3.5" /> Add
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
                {pendingIncoming.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Pending Requests ({pendingIncoming.length})
                    </h2>
                    <div className="space-y-2">
                      {pendingIncoming.map((f) => (
                        <motion.div key={f.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          className="glass rounded-xl px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-sm font-bold">
                              {displayInitial(f.profile)}
                            </div>
                            <span className="text-foreground font-medium text-sm">{displayName(f.profile)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => respondToRequest(f.id, true)} className="p-2 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors" title="Accept">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => respondToRequest(f.id, false)} className="p-2 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors" title="Decline">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {pendingOutgoing.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sent Requests ({pendingOutgoing.length})</h2>
                    <div className="space-y-2">
                      {pendingOutgoing.map((f) => (
                        <div key={f.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-bold">
                              {displayInitial(f.profile)}
                            </div>
                            <div>
                              <span className="text-foreground font-medium text-sm">{displayName(f.profile)}</span>
                              <span className="block text-xs text-muted-foreground">Pending…</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {user && acceptedFriends.length > 0 && (
                  <FriendGroups
                    userId={user.id}
                    friends={acceptedFriends}
                    onFilterChange={(gid) => handleGroupFilterChange(gid, "friends")}
                    activeGroupFilter={friendsGroupFilter}
                  />
                )}

                <section>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" /> Friends ({getFilteredFriends(friendsGroupFilter).length})
                  </h2>
                  {acceptedFriends.length === 0 ? (
                    <div className="glass rounded-xl p-8 text-center">
                      <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-muted-foreground text-sm">No friends yet. Search for usernames above to add friends!</p>
                    </div>
                  ) : getFilteredFriends(friendsGroupFilter).length === 0 ? (
                    <div className="glass rounded-xl p-8 text-center">
                      <p className="text-muted-foreground text-sm">No friends in this group yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getFilteredFriends(friendsGroupFilter).map((f) => (
                        <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="glass rounded-xl px-4 py-3 flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-sm font-bold">
                              {displayInitial(f.profile)}
                            </div>
                            <span className="text-foreground font-medium text-sm">{displayName(f.profile)}</span>
                          </div>
                          <button onClick={() => removeFriend(f.id)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100" title="Remove friend">
                            <UserMinus className="h-4 w-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </TabsContent>

          {/* ===== LINK UP TAB ===== */}
          <TabsContent value="linkup">
            {/* Friend selector */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Select a friend to compare queues</label>
              {acceptedFriends.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">No friends yet. Add friends in the Friends tab to start comparing queues!</p>
                </div>
              ) : user ? (
                <>
                  <FriendGroups
                    userId={user.id}
                    friends={acceptedFriends}
                    onFilterChange={(gid) => handleGroupFilterChange(gid, "linkup")}
                    activeGroupFilter={linkUpGroupFilter}
                  />
                  <div className="flex flex-wrap gap-2">
                    {getFilteredFriends(linkUpGroupFilter).map((f) => (
                      <button
                        key={f.profile.user_id}
                        onClick={() => setSelectedFriend(
                          selectedFriend?.user_id === f.profile.user_id ? null : f.profile
                        )}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          selectedFriend?.user_id === f.profile.user_id
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "glass hover:border-primary/50 text-foreground"
                        }`}
                    >
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        selectedFriend?.user_id === f.profile.user_id
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-gradient-brand text-primary-foreground"
                      }`}>
                        {displayInitial(f.profile)}
                      </div>
                      {displayName(f.profile)}
                    </button>
                  ))}
                  </div>
                </>
              ) : null}
            </div>

            {/* Shared Queue */}
            {selectedFriend && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold text-foreground">
                    {displayName(selectedFriend)}'s <span className="text-gradient">Queue</span>
                  </h2>
                  {!linkUpLoading && (
                    <span className="text-xs text-muted-foreground glass px-2 py-0.5 rounded-full">
                      {sharedCues.length} titles
                    </span>
                  )}
                </div>

                {/* Filter buttons */}
                {!linkUpLoading && sharedCues.length > 0 && (
                  <div className="flex gap-2 mb-5">
                    {(["all", "common", "unique"] as const).map((f) => (
                      <button key={f} onClick={() => setLinkUpFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          linkUpFilter === f
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "glass text-muted-foreground hover:text-foreground"
                        }`}>
                        {f === "all" ? "All" : f === "common" ? "In Common" : "Not in My Queue"}
                      </button>
                    ))}
                  </div>
                )}

                {linkUpLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : sharedCues.length === 0 ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-12 text-center">
                    <Film className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                    <h3 className="text-foreground font-semibold mb-1">No titles yet</h3>
                    <p className="text-muted-foreground text-sm">
                      {displayName(selectedFriend)} hasn't added anything to their queue yet.
                    </p>
                  </motion.div>
                ) : (() => {
                  const filtered = sharedCues.filter((cue) => {
                    if (linkUpFilter === "common") return !!cue.my_service;
                    if (linkUpFilter === "unique") return !cue.my_service;
                    return true;
                  });
                  if (filtered.length === 0) return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-8 text-center">
                      <p className="text-muted-foreground text-sm">
                        {linkUpFilter === "common" ? "No overlapping titles with this friend." : "All of their titles are already in your queue!"}
                      </p>
                    </motion.div>
                  );
                  return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {filtered.map((cue, i) => {
                        const poster = getImageUrl(cue.poster_path, "w300");
                        const isInMyQueue = !!cue.my_service;
                        const myLink = getDeepLink(cue.friend_service, cue.title, cue.friend_deep_link);
                        const friendService = getService(cue.friend_service);
                        return (
                          <motion.div key={cue.tmdb_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }} className="glass rounded-xl overflow-hidden flex group">
                            <div className="w-24 h-36 flex-shrink-0 relative">
                              {poster ? (
                                <img src={poster} alt={cue.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-secondary flex items-center justify-center">
                                  {cue.media_type === "tv" ? <Tv className="h-6 w-6 text-muted-foreground" /> : <Film className="h-6 w-6 text-muted-foreground" />}
                                </div>
                              )}
                              {isInMyQueue && (
                                <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                  IN COMMON
                                </div>
                              )}
                            </div>
                            <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                              <div>
                                <h3 className="font-semibold text-foreground text-sm truncate">{cue.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <span className="uppercase">{cue.media_type}</span>
                                  {cue.release_year && <span>· {cue.release_year}</span>}
                                  {cue.vote_average && <span>· ⭐ {Number(cue.vote_average).toFixed(1)}</span>}
                                </div>
                                {friendService && (
                                  <div className="mt-1.5 text-xs text-muted-foreground">
                                    <span>{friendService.logo} {friendService.name}</span>
                                  </div>
                                )}
                              </div>
                              <a href={myLink} target="_blank" rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gradient-brand text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity glow">
                                <ExternalLink className="h-3 w-3" /> {isInMyQueue ? "Watch Together" : "Check It Out"}
                              </a>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                  );
                })()}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Friends;
