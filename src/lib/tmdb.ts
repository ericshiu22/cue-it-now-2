import { supabase } from "@/integrations/supabase/client";

const TMDB_IMAGE = "https://image.tmdb.org/t/p";

export const getImageUrl = (path: string | null, size: "w200" | "w300" | "w500" | "w780" | "original" = "w500") => {
  if (!path) return null;
  return `${TMDB_IMAGE}/${size}${path}`;
};

export interface TMDBResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type: "movie" | "tv";
  genre_ids: number[];
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProvidersResult {
  flatrate?: WatchProvider[];
  buy?: WatchProvider[];
  rent?: WatchProvider[];
  ads?: WatchProvider[];
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBResult[];
  total_pages: number;
  total_results: number;
}

const callTmdb = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("tmdb-search", { body });
  if (error) throw new Error(error.message);
  return data;
};

export const searchMulti = async (query: string): Promise<TMDBSearchResponse> => {
  return callTmdb({ action: "search", query });
};

export const getTrending = async (): Promise<TMDBSearchResponse> => {
  return callTmdb({ action: "trending" });
};

export const getDetails = async (mediaType: string, id: number) => {
  return callTmdb({ action: "details", media_type: mediaType, id });
};

export const getRecommendations = async (
  mediaType: "movie" | "tv",
  id: number
): Promise<TMDBResult[]> => {
  try {
    const data = await callTmdb({ action: "recommendations", media_type: mediaType, id });
    return (data.results || []).map((r: TMDBResult) => ({ ...r, media_type: r.media_type || mediaType }));
  } catch {
    return [];
  }
};

export const getWatchProviders = async (
  mediaType: "movie" | "tv",
  id: number
): Promise<WatchProvidersResult | null> => {
  try {
    const data = await callTmdb({ action: "watch_providers", media_type: mediaType, id });
    return data.results?.US || null;
  } catch {
    return null;
  }
};
