import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CuePayload {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  media_type: string;
  vote_average?: number;
  release_year?: string;
  overview?: string;
}

export const addCue = async (payload: CuePayload): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast.error("Sign in to save shows to your queue.");
    return false;
  }

  const { error } = await supabase.from("cues").insert({
    user_id: user.id,
    tmdb_id: payload.tmdb_id,
    title: payload.title,
    poster_path: payload.poster_path,
    media_type: payload.media_type,
    service_provider: "unassigned",
    vote_average: payload.vote_average ?? null,
    release_year: payload.release_year ?? null,
    overview: payload.overview ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      toast.info(`"${payload.title}" is already in your queue.`);
    } else {
      toast.error("Failed to save. Try again.");
    }
    return false;
  }

  toast.success(`"${payload.title}" added to your queue! 🎬`);
  return true;
};

export const removeCue = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from("cues").delete().eq("id", id);
  if (error) {
    toast.error("Failed to remove.");
    return false;
  }
  return true;
};
