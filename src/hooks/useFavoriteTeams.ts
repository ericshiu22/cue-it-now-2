import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface FavoriteTeam {
  id: string;
  team_abbr: string;
  league: string;
}

export const useFavoriteTeams = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteTeam[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) { setFavorites([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("favorite_teams")
      .select("id, team_abbr, league")
      .eq("user_id", user.id);
    if (!error && data) setFavorites(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const addFavorite = async (teamAbbr: string, league: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("favorite_teams")
      .insert({ user_id: user.id, team_abbr: teamAbbr, league })
      .select("id, team_abbr, league")
      .single();
    if (error) {
      if (error.code === "23505") toast.info("Team already in favorites");
      else toast.error("Failed to add favorite");
      return;
    }
    if (data) setFavorites((prev) => [...prev, data]);
    toast.success("Added to your favorites! ⭐");
  };

  const removeFavorite = async (teamAbbr: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("favorite_teams")
      .delete()
      .eq("user_id", user.id)
      .eq("team_abbr", teamAbbr);
    if (error) { toast.error("Failed to remove favorite"); return; }
    setFavorites((prev) => prev.filter((f) => f.team_abbr !== teamAbbr));
    toast("Removed from favorites");
  };

  const isFavorite = (teamAbbr: string) => favorites.some((f) => f.team_abbr === teamAbbr);

  const favoriteAbbrs = new Set(favorites.map((f) => f.team_abbr));

  return { favorites, loading, addFavorite, removeFavorite, isFavorite, favoriteAbbrs, fetchFavorites };
};
