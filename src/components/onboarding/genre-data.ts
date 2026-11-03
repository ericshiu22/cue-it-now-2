import { GenreShow, GenreShowMap } from "./types";

export const GENRE_LIST = [
  "Sci-Fi",
  "Crime",
  "Comedy",
  "Drama",
  "Horror",
  "Action",
  "Romance",
  "Thriller",
  "Fantasy",
  "Documentary",
  "Animation",
  "Reality",
];

export const GENRE_SHOWS: GenreShowMap = {
  "Sci-Fi": [
    { title: "Severance", poster: "🧠", year: "2022", service: "Apple TV+" },
    { title: "Andor", poster: "⚔️", year: "2022", service: "Disney+" },
    { title: "Stranger Things", poster: "🔦", year: "2016", service: "Netflix" },
    { title: "Monarch", poster: "👑", year: "2023", service: "Apple TV+" },
  ],
  Crime: [
    { title: "The Beast in Me", poster: "🐺", year: "2025", service: "Hulu" },
    { title: "Dark Winds", poster: "🌪️", year: "2022", service: "AMC+" },
    { title: "The Night Manager", poster: "🕵️", year: "2016", service: "Prime Video" },
    { title: "Adolescence", poster: "🎭", year: "2025", service: "Netflix" },
  ],
  Comedy: [
    { title: "Shrinking", poster: "🛋️", year: "2023", service: "Apple TV+" },
    { title: "The Studio", poster: "🎬", year: "2025", service: "Apple TV+" },
    { title: "Running Point", poster: "🏀", year: "2025", service: "Netflix" },
    { title: "Wonder Man", poster: "🦸", year: "2025", service: "Disney+" },
  ],
  Drama: [
    { title: "The Bear", poster: "🐻", year: "2022", service: "Hulu" },
    { title: "Shogun", poster: "⛩️", year: "2024", service: "Hulu" },
    { title: "Slow Horses", poster: "🐎", year: "2022", service: "Apple TV+" },
    { title: "The Diplomat", poster: "🏛️", year: "2023", service: "Netflix" },
  ],
  Horror: [
    { title: "From", poster: "🌲", year: "2022", service: "Paramount+" },
    { title: "The Last of Us", poster: "🍄", year: "2023", service: "HBO Max" },
    { title: "Yellowjackets", poster: "🐝", year: "2021", service: "Paramount+" },
    { title: "Haunting of Hill House", poster: "🏚️", year: "2018", service: "Netflix" },
  ],
  Action: [
    { title: "Reacher", poster: "💪", year: "2022", service: "Prime Video" },
    { title: "Citadel", poster: "🔫", year: "2023", service: "Prime Video" },
    { title: "The Night Agent", poster: "🌙", year: "2023", service: "Netflix" },
    { title: "Echo", poster: "🏹", year: "2024", service: "Disney+" },
  ],
  Romance: [
    { title: "Bridgerton", poster: "💐", year: "2020", service: "Netflix" },
    { title: "Normal People", poster: "💕", year: "2020", service: "Hulu" },
    { title: "Daisy Jones & The Six", poster: "🎸", year: "2023", service: "Prime Video" },
    { title: "One Day", poster: "📅", year: "2024", service: "Netflix" },
  ],
  Thriller: [
    { title: "Black Mirror", poster: "📱", year: "2011", service: "Netflix" },
    { title: "The Recruit", poster: "🕶️", year: "2022", service: "Netflix" },
    { title: "Hijack", poster: "✈️", year: "2023", service: "Apple TV+" },
    { title: "Ripley", poster: "🎭", year: "2024", service: "Netflix" },
  ],
  Fantasy: [
    { title: "House of the Dragon", poster: "🐉", year: "2022", service: "HBO Max" },
    { title: "The Rings of Power", poster: "💍", year: "2022", service: "Prime Video" },
    { title: "The Witcher", poster: "🗡️", year: "2019", service: "Netflix" },
    { title: "Percy Jackson", poster: "⚡", year: "2023", service: "Disney+" },
  ],
  Documentary: [
    { title: "Blue Planet III", poster: "🌊", year: "2025", service: "Discovery+" },
    { title: "The Me You Can't See", poster: "🧘", year: "2021", service: "Apple TV+" },
    { title: "Our Planet", poster: "🌍", year: "2019", service: "Netflix" },
    { title: "The Curse of Von Dutch", poster: "🧢", year: "2021", service: "Hulu" },
  ],
  Animation: [
    { title: "Invincible", poster: "🦸", year: "2021", service: "Prime Video" },
    { title: "Arcane", poster: "⚡", year: "2021", service: "Netflix" },
    { title: "X-Men '97", poster: "🧬", year: "2024", service: "Disney+" },
    { title: "Blue Eye Samurai", poster: "🗡️", year: "2023", service: "Netflix" },
  ],
  Reality: [
    { title: "The Traitors", poster: "🏰", year: "2023", service: "Peacock" },
    { title: "Love Is Blind", poster: "💘", year: "2020", service: "Netflix" },
    { title: "The Amazing Race", poster: "🏁", year: "2001", service: "Paramount+" },
    { title: "Survivor", poster: "🏝️", year: "2000", service: "Paramount+" },
  ],
};

/** Normalizes a title so "The Bear", "the bear " and "The Bear!" match. */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Returns the shows to display for each selected genre, in selection order,
 * with any title already shown under an earlier genre removed. A show that
 * fits several genres therefore appears only once across the whole picker.
 */
export function getDedupedGenreShows(
  genres: string[],
  showMap: GenreShowMap = GENRE_SHOWS
): { genre: string; shows: GenreShow[] }[] {
  const seen = new Set<string>();
  return genres.map((genre) => {
    const shows = (showMap[genre] || []).filter((show) => {
      const key = normalizeTitle(show.title);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { genre, shows };
  });
}
