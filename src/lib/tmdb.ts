const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p";

// TMDB API key - this is a read-only public API key for movie data
const API_KEY = ""; // Will be set by user

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

export const searchMulti = async (query: string, apiKey: string): Promise<TMDBSearchResponse> => {
  const res = await fetch(
    `${TMDB_BASE}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`
  );
  if (!res.ok) throw new Error("TMDB search failed");
  return res.json();
};

export const getTrending = async (apiKey: string): Promise<TMDBSearchResponse> => {
  const res = await fetch(
    `${TMDB_BASE}/trending/all/week?api_key=${apiKey}`
  );
  if (!res.ok) throw new Error("TMDB trending failed");
  return res.json();
};

export const getWatchProviders = async (
  mediaType: "movie" | "tv",
  id: number,
  apiKey: string
): Promise<WatchProvidersResult | null> => {
  try {
    const res = await fetch(
      `${TMDB_BASE}/${mediaType}/${id}/watch/providers?api_key=${apiKey}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Use US providers by default
    return data.results?.US || null;
  } catch {
    return null;
  }
};
