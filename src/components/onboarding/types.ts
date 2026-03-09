export interface OnboardingData {
  habits: string[];
  searchTime: number;
  friendSuggestions: boolean;
  selectedServices: string[];
  guessedSpend: number;
  realCost: number;
  genres: string[];
  seenShows: string[];
  wantToWatch: ShowSelection[];
}

export interface ShowSelection {
  title: string;
  genre: string;
  poster: string;
}

export interface GenreShowMap {
  [genre: string]: GenreShow[];
}

export interface GenreShow {
  title: string;
  poster: string;
  year: string;
  service: string;
}
